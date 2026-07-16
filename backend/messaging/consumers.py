import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, ConversationMember, PresenceStatus, TypingStatus, MessageReceipt

User = get_user_model()

class CommunicationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)  # Unauthorized
            return

        self.personal_group = f"user_{self.user.id}"
        
        # Accept connection
        await self.accept()

        # Join personal group for direct notifications/messages
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        # Join groups for all active conversations the user is in
        self.conversation_ids = await self.get_user_conversation_ids()
        for cid in self.conversation_ids:
            await self.channel_layer.group_add(f"conversation_{cid}", self.channel_name)

        # Set user presence to ONLINE
        await self.update_presence("ONLINE")
        await self.broadcast_presence("ONLINE")

    async def disconnect(self, close_code):
        if hasattr(self, "personal_group"):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
            
            # Set user presence to OFFLINE
            await self.update_presence("OFFLINE")
            await self.broadcast_presence("OFFLINE")

            # Leave conversation groups
            if hasattr(self, "conversation_ids"):
                for cid in self.conversation_ids:
                    await self.channel_layer.group_discard(f"conversation_{cid}", self.channel_name)

    async def receive_json(self, content):
        event_type = content.get("type")

        if event_type == "typing":
            conversation_id = content.get("conversation_id")
            is_typing = content.get("is_typing", False)
            if conversation_id:
                await self.channel_layer.group_send(
                    f"conversation_{conversation_id}",
                    {
                        "type": "chat.typing",
                        "conversation_id": conversation_id,
                        "user_id": self.user.id,
                        "user_name": self.user.full_name,
                        "is_typing": is_typing,
                    }
                )

        elif event_type == "presence_change":
            status = content.get("status", "ONLINE")  # AWAY, Busy, etc.
            custom_msg = content.get("custom_message", "")
            await self.update_presence(status, custom_msg)
            await self.broadcast_presence(status, custom_msg)

        elif event_type == "mark_read":
            conversation_id = content.get("conversation_id")
            if conversation_id:
                await self.mark_conversation_read(conversation_id)
                await self.channel_layer.group_send(
                    f"conversation_{conversation_id}",
                    {
                        "type": "chat.read_receipt",
                        "conversation_id": conversation_id,
                        "user_id": self.user.id,
                        "user_name": self.user.full_name,
                        "timestamp": timezone.now().isoformat(),
                    }
                )

        elif event_type == "call_signal":
            # Forward WebRTC signal to conversation members via WebSocket
            call_id = content.get("call_id")
            conversation_id = content.get("conversation_id")
            signal_type = content.get("signal_type")
            payload = content.get("payload")
            if conversation_id and signal_type and payload:
                await self.channel_layer.group_send(
                    f"conversation_{conversation_id}",
                    {
                        "type": "call.signal",
                        "call_id": call_id,
                        "conversation_id": conversation_id,
                        "signal_type": signal_type,
                        "payload": payload,
                        "sender_id": self.user.id,
                        "sender_name": self.user.full_name,
                    }
                )

        elif event_type == "ping":
            await self.send_json({"type": "pong"})

    # Database Helpers
    @database_sync_to_async
    def get_user_conversation_ids(self):
        return list(Conversation.objects.filter(members=self.user).values_list('id', flat=True))

    @database_sync_to_async
    def update_presence(self, status, custom_message=""):
        presence, _ = PresenceStatus.objects.get_or_create(user=self.user)
        presence.status = status
        presence.custom_message = custom_message
        presence.last_seen = timezone.now()
        presence.save()

    @database_sync_to_async
    def update_typing_status(self, conversation_id, is_typing):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            status, _ = TypingStatus.objects.get_or_create(conversation=conv, user=self.user)
            status.is_typing = is_typing
            status.save()
        except Conversation.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_conversation_read(self, conversation_id):
        ConversationMember.objects.filter(conversation_id=conversation_id, user=self.user).update(last_read_at=timezone.now())

    # Broadcast Helpers
    async def broadcast_presence(self, status, custom_message=""):
        # Send presence updates to all conversations
        for cid in self.conversation_ids:
            await self.channel_layer.group_send(
                f"conversation_{cid}",
                {
                    "type": "chat.presence",
                    "user_id": self.user.id,
                    "user_name": self.user.full_name,
                    "status": status,
                    "custom_message": custom_message,
                    "last_seen": timezone.now().isoformat()
                }
            )

    # Event Handlers (for Channel Group Sends)
    async def chat_message(self, event):
        await self.send_json(event)

    async def chat_typing(self, event):
        # Prevent echoing back to sender
        if event["user_id"] != self.user.id:
            await self.send_json(event)

    async def chat_presence(self, event):
        if event["user_id"] != self.user.id:
            await self.send_json(event)

    async def chat_read_receipt(self, event):
        if event["user_id"] != self.user.id:
            await self.send_json(event)

    async def chat_reaction(self, event):
        await self.send_json(event)

    async def user_notification(self, event):
        await self.send_json(event)

    # Call event handlers
    async def call_ring(self, event):
        """Notify all conversation members of an incoming call."""
        await self.send_json(event)

    async def call_signal(self, event):
        """Forward WebRTC signaling (offer/answer/ICE) - don't echo back to sender."""
        if event.get("sender_id") != self.user.id:
            await self.send_json(event)

    async def call_end(self, event):
        """Notify all participants that a call has ended."""
        await self.send_json(event)

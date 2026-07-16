from django.contrib.auth import get_user_model
from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from authentication.serializers import UserSerializer
from notifications.models import Notification
from .models import Conversation, ConversationMember, Message, CallSession, CallSignal
from .serializers import ConversationSerializer, MessageSerializer, CallSessionSerializer, CallSignalSerializer, PresenceStatusSerializer

User = get_user_model()


from notifications.services import NotificationService

def notify_conversation_members(conversation, actor, title, message):
    recipients = conversation.members.exclude(id=actor.id)
    for recipient in recipients:
        NotificationService.send_notification(
            recipient=recipient,
            sender=actor,
            title=title,
            message=message,
            category='MESSAGE',
            priority='NORMAL',
            conversation=conversation
        )


class IsConversationMemberMixin:
    def get_conversation(self, conversation_id):
        conversation = Conversation.objects.filter(id=conversation_id, members=self.request.user).first()
        if not conversation:
            raise PermissionDenied('You are not a member of this conversation.')
        return conversation


class ConversationViewSet(IsConversationMemberMixin, viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'conversation_members__user__first_name', 'conversation_members__user__last_name', 'conversation_members__user__email']
    ordering_fields = ['updated_at', 'created_at']

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(members=self.request.user)
            .prefetch_related('conversation_members__user', 'messages')
            .order_by('-updated_at')
            .distinct()
        )

    def perform_create(self, serializer):
        conversation = serializer.save()
        notify_conversation_members(
            conversation,
            self.request.user,
            'New chat',
            f'{self.request.user.full_name} added you to {conversation.title or "a conversation"}.',
        )

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        ConversationMember.objects.filter(conversation=conversation, user=request.user).update(last_read_at=timezone.now())
        return Response({'detail': 'Conversation marked as read.'})

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        conversation = self.get_object()
        if conversation.conversation_type == Conversation.DIRECT:
            return Response({'detail': 'Cannot leave a direct conversation.'}, status=status.HTTP_400_BAD_REQUEST)
        membership = ConversationMember.objects.filter(conversation=conversation, user=request.user).first()
        if not membership:
            return Response({'detail': 'Not a member.'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            message_type=Message.SYSTEM,
            body=f'{request.user.full_name} left the group.',
        )
        broadcast_to_conversation(conversation.id, {
            "type": "chat.message",
            "message": {
                "id": None, "conversation": conversation.id, "body": f'{request.user.full_name} left the group.',
                "message_type": "SYSTEM", "sender": request.user.id,
            }
        })
        return Response({'detail': 'You have left the conversation.'})

    @action(detail=True, methods=['post'], url_path='add-members')
    def add_members(self, request, pk=None):
        conversation = self.get_object()
        if conversation.conversation_type == Conversation.DIRECT:
            return Response({'detail': 'Cannot add members to a direct conversation.'}, status=status.HTTP_400_BAD_REQUEST)
        member_ids = request.data.get('member_ids', [])
        if not member_ids:
            return Response({'detail': 'member_ids is required.'}, status=status.HTTP_400_BAD_REQUEST)
        existing = set(conversation.members.values_list('id', flat=True))
        added_names = []
        for uid in member_ids:
            if uid not in existing:
                user_obj = User.objects.filter(id=uid, is_active=True).first()
                if user_obj:
                    ConversationMember.objects.create(conversation=conversation, user=user_obj)
                    added_names.append(user_obj.full_name)
        if added_names:
            names_str = ', '.join(added_names)
            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                message_type=Message.SYSTEM,
                body=f'{request.user.full_name} added {names_str} to the group.',
            )
        return Response({'detail': f'{len(added_names)} member(s) added.', 'added': added_names})



def broadcast_to_conversation(conversation_id, payload):
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"conversation_{conversation_id}",
            payload
        )


class MessageViewSet(IsConversationMemberMixin, viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at']
    pagination_class = None

    def get_queryset(self):
        queryset = Message.objects.filter(conversation__members=self.request.user).select_related('sender', 'conversation')
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset.order_by('created_at').distinct()

    def perform_create(self, serializer):
        conversation = self.get_conversation(self.request.data.get('conversation'))
        message_type = Message.FILE if self.request.FILES.get('attachment') else self.request.data.get('message_type', Message.TEXT)
        parent_id = self.request.data.get('parent_message')
        parent_message = None
        if parent_id:
            parent_message = Message.objects.filter(id=parent_id).first()

        message = serializer.save(
            sender=self.request.user, 
            conversation=conversation, 
            message_type=message_type,
            parent_message=parent_message
        )

        # Handle voice message association
        is_voice = self.request.data.get('is_voice') == 'true' or self.request.data.get('is_voice') is True
        if is_voice and self.request.FILES.get('attachment'):
            from .models import VoiceMessage
            import random
            waveform = [random.randint(10, 100) for _ in range(30)]
            VoiceMessage.objects.create(
                message=message,
                audio_file=self.request.FILES.get('attachment'),
                duration=float(self.request.data.get('voice_duration', 0.0)),
                waveform=waveform
            )
            message.message_type = Message.FILE
            message.save()

        # Handle mentions notification logic
        import re
        body_text = message.body or ""
        mentions = re.findall(r'@(\w+)', body_text)
        if mentions:
            from .models import Mention
            for username in mentions:
                mentioned_user = User.objects.filter(email__icontains=username).first()
                if not mentioned_user:
                    mentioned_user = User.objects.filter(first_name__icontains=username).first()
                if mentioned_user and mentioned_user != self.request.user:
                    Mention.objects.create(message=message, user=mentioned_user, mention_type='USER')
                    from notifications.services import NotificationService
                    NotificationService.send_notification(
                        recipient=mentioned_user,
                        title='You were mentioned',
                        message=f'{self.request.user.full_name} mentioned you in a chat: "{body_text[:60]}"',
                        send_email=True
                    )
        if '@all' in body_text.lower() or '@everyone' in body_text.lower():
            from .models import Mention
            from notifications.services import NotificationService
            for member in conversation.members.exclude(id=self.request.user.id):
                Mention.objects.create(message=message, user=member, mention_type='EVERYONE')
                NotificationService.send_notification(
                    recipient=member,
                    title='Mention in Group',
                    message=f'{self.request.user.full_name} mentioned everyone in: "{body_text[:60]}"'
                )

        # Create Message Receipts for all members of the conversation
        from .models import MessageReceipt, PresenceStatus
        members = conversation.members.all()
        for member in members:
            if member == self.request.user:
                MessageReceipt.objects.update_or_create(
                    message=message, user=member, defaults={'status': 'SEEN'}
                )
            else:
                presence = PresenceStatus.objects.filter(user=member).first()
                status_val = 'SENT'
                if presence and presence.status == 'ONLINE':
                    status_val = 'DELIVERED'
                MessageReceipt.objects.update_or_create(
                    message=message, user=member, defaults={'status': status_val}
                )

        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        # Broadcast WebSocket new_message event
        serialized_data = self.get_serializer(message).data
        broadcast_to_conversation(conversation.id, {
            "type": "chat.message",
            "message": serialized_data
        })

        ConversationMember.objects.filter(conversation=conversation, user=self.request.user).update(last_read_at=timezone.now())
        body = message.body[:120] if message.body else f'Sent a file: {message.attachment.name.split("/")[-1]}'
        notify_conversation_members(conversation, self.request.user, 'New message', f'{self.request.user.full_name}: {body}')

    def perform_update(self, serializer):
        message = self.get_object()
        if message.sender != self.request.user:
            raise PermissionDenied('You can edit only your own messages.')
        if message.is_deleted:
            raise PermissionDenied('Deleted messages cannot be edited.')
        updated_message = serializer.save(edited_at=timezone.now())
        updated_message.conversation.updated_at = timezone.now()
        updated_message.conversation.save(update_fields=['updated_at'])

        # Broadcast WebSocket edit
        serialized_data = self.get_serializer(updated_message).data
        broadcast_to_conversation(updated_message.conversation.id, {
            "type": "chat.message",
            "message": serialized_data
        })

    def perform_destroy(self, instance):
        if instance.sender != self.request.user:
            raise PermissionDenied('You can delete only your own messages.')
        instance.body = ''
        instance.attachment = None
        instance.is_deleted = True
        instance.edited_at = timezone.now()
        instance.save(update_fields=['body', 'attachment', 'is_deleted', 'edited_at'])

        # Broadcast WebSocket deletion
        serialized_data = self.get_serializer(instance).data
        broadcast_to_conversation(instance.conversation.id, {
            "type": "chat.message",
            "message": serialized_data
        })

    @action(detail=True, methods=['post'], url_path='react')
    def react(self, request, pk=None):
        message = self.get_object()
        emoji = request.data.get('emoji')
        if not emoji:
            return Response({'detail': 'Emoji is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import MessageReaction
        reaction = MessageReaction.objects.filter(message=message, user=request.user, emoji=emoji).first()
        if reaction:
            reaction.delete()
            action_done = 'removed'
        else:
            MessageReaction.objects.create(message=message, user=request.user, emoji=emoji)
            action_done = 'added'

        serialized_data = self.get_serializer(message).data
        broadcast_to_conversation(message.conversation.id, {
            "type": "chat.reaction",
            "message_id": message.id,
            "conversation_id": message.conversation.id,
            "reactions": serialized_data['reactions']
        })
        return Response({'status': f'Reaction {action_done}', 'reactions': serialized_data['reactions']})

    @action(detail=True, methods=['post'], url_path='pin')
    def pin_message(self, request, pk=None):
        message = self.get_object()
        is_lead = request.user.role in ['ADMIN', 'MANAGER']
        if not is_lead:
            raise PermissionDenied('Only admins or managers can pin messages.')

        from .models import PinnedMessage
        pin = PinnedMessage.objects.filter(conversation=message.conversation, message=message).first()
        if pin:
            pin.delete()
            action_done = 'unpinned'
        else:
            PinnedMessage.objects.create(conversation=message.conversation, message=message, pinned_by=request.user)
            action_done = 'pinned'

        serialized_data = self.get_serializer(message).data
        broadcast_to_conversation(message.conversation.id, {
            "type": "chat.message",
            "message": serialized_data
        })
        return Response({'status': f'Message {action_done}'})

    @action(detail=True, methods=['post'], url_path='star')
    def star_message(self, request, pk=None):
        message = self.get_object()
        if request.user in message.starred_by.all():
            message.starred_by.remove(request.user)
            action_done = 'unstarred'
        else:
            message.starred_by.add(request.user)
            action_done = 'starred'
        return Response({'status': f'Message {action_done}', 'is_starred': request.user in message.starred_by.all()})

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        message = self.get_object()
        # Fallback to voice message field if attachment is empty
        file_obj = message.attachment
        if not file_obj and hasattr(message, 'voice_message'):
            file_obj = message.voice_message.audio_file
        if not file_obj or message.is_deleted:
            return Response({'detail': 'Attachment not found.'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            file_obj.open('rb'),
            as_attachment=True,
            filename=file_obj.name.split('/')[-1],
        )

    @action(detail=True, methods=['post'], url_path='forward')
    def forward(self, request, pk=None):
        message = self.get_object()
        if message.is_deleted:
            return Response({'detail': 'Cannot forward a deleted message.'}, status=status.HTTP_400_BAD_REQUEST)
        target_conversation_id = request.data.get('target_conversation')
        if not target_conversation_id:
            return Response({'detail': 'target_conversation is required.'}, status=status.HTTP_400_BAD_REQUEST)
        target_conversation = Conversation.objects.filter(id=target_conversation_id, members=request.user).first()
        if not target_conversation:
            raise PermissionDenied('You are not a member of the target conversation.')
        forwarded_msg = Message.objects.create(
            conversation=target_conversation,
            sender=request.user,
            body=message.body,
            message_type=Message.TEXT,
            forwarded_from=message,
        )
        # Create receipts for the forwarded message
        from .models import MessageReceipt, PresenceStatus as PresenceStatusModel
        for member in target_conversation.members.all():
            if member == request.user:
                MessageReceipt.objects.update_or_create(message=forwarded_msg, user=member, defaults={'status': 'SEEN'})
            else:
                presence = PresenceStatusModel.objects.filter(user=member).first()
                status_val = 'DELIVERED' if presence and presence.status == 'ONLINE' else 'SENT'
                MessageReceipt.objects.update_or_create(message=forwarded_msg, user=member, defaults={'status': status_val})
        target_conversation.updated_at = timezone.now()
        target_conversation.save(update_fields=['updated_at'])
        serialized_data = self.get_serializer(forwarded_msg).data
        broadcast_to_conversation(target_conversation.id, {
            "type": "chat.message",
            "message": serialized_data
        })
        body_preview = forwarded_msg.body[:120] if forwarded_msg.body else 'Forwarded a message'
        notify_conversation_members(target_conversation, request.user, 'Forwarded message', f'{request.user.full_name}: {body_preview}')
        return Response(serialized_data, status=status.HTTP_201_CREATED)



class PresenceStatusViewSet(viewsets.ModelViewSet):
    serializer_class = PresenceStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PresenceStatus.objects.all()

    @action(detail=False, methods=['post'], url_path='update-status')
    def update_status(self, request):
        status_val = request.data.get('status', 'ONLINE')
        custom_message = request.data.get('custom_message', '')
        presence, _ = PresenceStatus.objects.get_or_create(user=request.user)
        presence.status = status_val
        presence.custom_message = custom_message
        presence.last_seen = timezone.now()
        presence.save()

        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer:
            cids = list(Conversation.objects.filter(members=request.user).values_list('id', flat=True))
            for cid in cids:
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{cid}",
                    {
                        "type": "chat.presence",
                        "user_id": request.user.id,
                        "user_name": request.user.full_name,
                        "status": status_val,
                        "custom_message": custom_message,
                        "last_seen": timezone.now().isoformat()
                    }
                )
        return Response(PresenceStatusSerializer(presence).data)



class CallSessionViewSet(IsConversationMemberMixin, viewsets.ModelViewSet):
    serializer_class = CallSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = CallSession.objects.filter(conversation__members=self.request.user).select_related('conversation', 'initiated_by')
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset.order_by('-started_at').distinct()

    def perform_create(self, serializer):
        conversation = self.get_conversation(self.request.data.get('conversation'))
        call = serializer.save(initiated_by=self.request.user, conversation=conversation)
        Message.objects.create(
            conversation=conversation,
            sender=self.request.user,
            message_type=Message.CALL,
            body=f'Started a {call.call_type.lower()} call.',
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        # Broadcast incoming call ringing event via WebSocket
        broadcast_to_conversation(conversation.id, {
            "type": "call.ring",
            "call_id": call.id,
            "conversation_id": conversation.id,
            "call_type": call.call_type,
            "caller_id": self.request.user.id,
            "caller_name": self.request.user.full_name,
            "status": "RINGING",
        })

        notify_conversation_members(
            conversation,
            self.request.user,
            'Incoming call',
            f'{self.request.user.full_name} started a {call.call_type.lower()} call.',
        )

    @action(detail=True, methods=['post'], url_path='end')
    def end_call(self, request, pk=None):
        call = self.get_object()
        # A call that ends while still RINGING (never answered) is a missed
        # call rather than a completed one - keep call history accurate.
        call.status = CallSession.MISSED if call.status == CallSession.RINGING else CallSession.ENDED
        call.ended_at = timezone.now()
        call.save(update_fields=['status', 'ended_at'])

        if call.status == CallSession.MISSED:
            Message.objects.create(
                conversation=call.conversation,
                sender=call.initiated_by,
                message_type=Message.SYSTEM,
                body=f'Missed {call.call_type.lower()} call.',
            )

        # Broadcast call end event via WebSocket
        broadcast_to_conversation(call.conversation_id, {
            "type": "call.end",
            "call_id": call.id,
            "conversation_id": call.conversation_id,
            "status": call.status,
            "ended_by": request.user.id,
            "ended_by_name": request.user.full_name,
        })

        return Response(self.get_serializer(call).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='decline')
    def decline_call(self, request, pk=None):
        """Callee explicitly rejects an incoming call - always recorded as MISSED
        and the caller is notified immediately instead of ringing indefinitely."""
        call = self.get_object()
        call.status = CallSession.MISSED
        call.ended_at = timezone.now()
        call.save(update_fields=['status', 'ended_at'])

        Message.objects.create(
            conversation=call.conversation,
            sender=call.initiated_by,
            message_type=Message.SYSTEM,
            body=f'{request.user.full_name} declined the {call.call_type.lower()} call.',
        )

        broadcast_to_conversation(call.conversation_id, {
            "type": "call.end",
            "call_id": call.id,
            "conversation_id": call.conversation_id,
            "status": call.status,
            "ended_by": request.user.id,
            "ended_by_name": request.user.full_name,
            "reason": "declined",
        })

        return Response(self.get_serializer(call).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='signals')
    def signals(self, request, pk=None):
        call = self.get_object()
        after_id = request.query_params.get('after')
        signals = call.signals.exclude(sender=request.user).select_related('sender')
        if after_id:
            signals = signals.filter(id__gt=after_id)
        return Response(CallSignalSerializer(signals, many=True).data)

    @action(detail=True, methods=['post'], url_path='signal')
    def signal(self, request, pk=None):
        call = self.get_object()
        serializer = CallSignalSerializer(data={
            'call': call.id,
            'signal_type': request.data.get('signal_type'),
            'payload': request.data.get('payload'),
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(call=call, sender=request.user)
        if call.status == CallSession.RINGING:
            call.status = CallSession.ACTIVE
            call.save(update_fields=['status'])

        # Broadcast WebRTC signal to conversation members via WebSocket
        # Include the signal's real DB id so the frontend can dedupe this
        # WebSocket push against the same signal seen later via polling.
        broadcast_to_conversation(call.conversation_id, {
            "type": "call.signal",
            "id": serializer.instance.id,
            "call_id": call.id,
            "conversation_id": call.conversation_id,
            "signal_type": request.data.get('signal_type'),
            "payload": request.data.get('payload'),
            "sender_id": request.user.id,
            "sender_name": request.user.full_name,
        })

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MemberDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_active=True).exclude(id=self.request.user.id).order_by('first_name', 'last_name')

    def list(self, request, *args, **kwargs):
        users = self.get_queryset()
        data = [
            {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
            }
            for user in users
        ]
        return Response(data)

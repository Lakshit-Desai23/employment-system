from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from authentication.serializers import UserSerializer
from .models import (
    Conversation, ConversationMember, Message, CallSession, CallSignal,
    MessageReaction, VoiceMessage, PinnedMessage, Mention, PresenceStatus,
    MessageReceipt, Device, PushSubscription
)

User = get_user_model()


class ConversationMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = ConversationMember
        fields = ('id', 'user', 'user_details', 'is_admin', 'joined_at', 'last_read_at')
        read_only_fields = ('id', 'joined_at', 'last_read_at')


class MessageReactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ('id', 'user', 'user_email', 'user_name', 'emoji', 'created_at')


class VoiceMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceMessage
        fields = ('id', 'audio_file', 'duration', 'waveform')


class PresenceStatusSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = PresenceStatus
        fields = ('id', 'user', 'user_email', 'status', 'custom_message', 'last_seen')


class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    attachment_name = serializers.SerializerMethodField()
    reactions = MessageReactionSerializer(many=True, read_only=True)
    voice_message = VoiceMessageSerializer(read_only=True)
    parent_message_details = serializers.SerializerMethodField()
    is_pinned = serializers.SerializerMethodField()
    receipts_details = serializers.SerializerMethodField()
    forwarded_from_details = serializers.SerializerMethodField()
    starred_by_users = serializers.PrimaryKeyRelatedField(source='starred_by', many=True, read_only=True)

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'sender_details', 'body', 'attachment',
            'attachment_name', 'message_type', 'parent_message', 'parent_message_details',
            'forwarded_from', 'forwarded_from_details',
            'reactions', 'voice_message', 'is_pinned', 'receipts_details', 'starred_by_users',
            'edited_at', 'is_deleted', 'created_at',
        )
        read_only_fields = (
            'id', 'sender', 'attachment_name', 'edited_at', 'is_deleted', 'created_at',
            'parent_message_details', 'forwarded_from_details', 'reactions', 'voice_message',
            'is_pinned', 'receipts_details', 'starred_by_users'
        )

    def get_attachment_name(self, obj):
        return obj.attachment.name.split('/')[-1] if obj.attachment else ''

    def get_parent_message_details(self, obj):
        if obj.parent_message:
            return {
                'id': obj.parent_message.id,
                'body': obj.parent_message.body,
                'sender_name': obj.parent_message.sender.full_name,
                'message_type': obj.parent_message.message_type,
            }
        return None

    def get_is_pinned(self, obj):
        return obj.pins.exists()

    def get_receipts_details(self, obj):
        return [
            {
                'user_id': r.user_id,
                'user_name': r.user.full_name,
                'status': r.status,
                'timestamp': r.timestamp
            } for r in obj.receipts.all()
        ]

    def get_forwarded_from_details(self, obj):
        if obj.forwarded_from:
            return {
                'id': obj.forwarded_from.id,
                'body': obj.forwarded_from.body,
                'sender_name': obj.forwarded_from.sender.full_name,
                'conversation_title': str(obj.forwarded_from.conversation),
            }
        return None

    def validate(self, attrs):
        body = attrs.get('body', getattr(self.instance, 'body', '') if self.instance else '')
        attachment = attrs.get('attachment', getattr(self.instance, 'attachment', None) if self.instance else None)
        message_type = attrs.get('message_type', getattr(self.instance, 'message_type', 'TEXT') if self.instance else 'TEXT')
        if message_type != 'CALL' and not str(body).strip() and not attachment:
            raise serializers.ValidationError({'body': 'Message or file is required.'})
        if attachment:
            try:
                for validator in Message._meta.get_field('attachment').validators:
                    validator(attachment)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'attachment': exc.messages})
        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    conversation_members = ConversationMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=False,
    )

    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'title', 'conversation_type', 'created_by', 'conversation_members',
            'member_ids', 'last_message', 'unread_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        return MessageSerializer(message).data if message else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        member = obj.conversation_members.filter(user=request.user).first()
        if not member or not member.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=member.last_read_at).count()

    def validate(self, attrs):
        request = self.context.get('request')
        members = attrs.get('member_ids', [])
        conversation_type = attrs.get('conversation_type', Conversation.DIRECT)
        if request and request.user not in members:
            members = [*members, request.user]
            attrs['member_ids'] = members
        if conversation_type == Conversation.DIRECT and len(members) != 2:
            raise serializers.ValidationError({'member_ids': 'Direct chat must have exactly two members.'})
        if conversation_type == Conversation.GROUP and len(members) < 2:
            raise serializers.ValidationError({'member_ids': 'Group chat needs at least two members.'})
        return attrs

    def create(self, validated_data):
        members = validated_data.pop('member_ids', [])
        request = self.context['request']
        conversation = Conversation.objects.create(created_by=request.user, **validated_data)
        for member in members:
            ConversationMember.objects.create(
                conversation=conversation,
                user=member,
                is_admin=member == request.user,
            )
        return conversation

    def update(self, instance, validated_data):
        members = validated_data.pop('member_ids', None)
        instance = super().update(instance, validated_data)
        if members is not None:
            existing = set(instance.conversation_members.values_list('user_id', flat=True))
            for member in members:
                if member.id not in existing:
                    ConversationMember.objects.create(conversation=instance, user=member)
        return instance


class CallSessionSerializer(serializers.ModelSerializer):
    initiated_by_details = UserSerializer(source='initiated_by', read_only=True)

    class Meta:
        model = CallSession
        fields = (
            'id', 'conversation', 'initiated_by', 'initiated_by_details',
            'call_type', 'status', 'started_at', 'ended_at',
        )
        read_only_fields = ('id', 'initiated_by', 'started_at', 'ended_at')


class CallSignalSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)

    class Meta:
        model = CallSignal
        fields = ('id', 'call', 'sender', 'sender_details', 'signal_type', 'payload', 'created_at')
        read_only_fields = ('id', 'sender', 'created_at')

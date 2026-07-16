from django.conf import settings
from django.db import models
from core.file_validators import validate_safe_upload


class Conversation(models.Model):
    DIRECT = 'DIRECT'
    GROUP = 'GROUP'
    TYPE_CHOICES = (
        (DIRECT, 'Direct'),
        (GROUP, 'Group'),
    )

    title = models.CharField(max_length=160, blank=True)
    conversation_type = models.CharField(max_length=12, choices=TYPE_CHOICES, default=DIRECT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_conversations')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='ConversationMember', related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or f'{self.conversation_type} conversation #{self.pk}'


class ConversationMember(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='conversation_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversation_memberships')
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f'{self.user.email} in {self.conversation_id}'


class Message(models.Model):
    TEXT = 'TEXT'
    FILE = 'FILE'
    SYSTEM = 'SYSTEM'
    CALL = 'CALL'
    TYPE_CHOICES = (
        (TEXT, 'Text'),
        (FILE, 'File'),
        (SYSTEM, 'System'),
        (CALL, 'Call'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True, validators=[validate_safe_upload])
    message_type = models.CharField(max_length=12, choices=TYPE_CHOICES, default=TEXT)
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    starred_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='starred_messages', blank=True)
    forwarded_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='forwards')
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'Message #{self.pk} by {self.sender.email}'


class CallSession(models.Model):
    VIDEO = 'VIDEO'
    AUDIO = 'AUDIO'
    SCREEN = 'SCREEN'
    CALL_TYPE_CHOICES = (
        (VIDEO, 'Video'),
        (AUDIO, 'Audio'),
        (SCREEN, 'Screen Share'),
    )

    RINGING = 'RINGING'
    ACTIVE = 'ACTIVE'
    ENDED = 'ENDED'
    MISSED = 'MISSED'
    STATUS_CHOICES = (
        (RINGING, 'Ringing'),
        (ACTIVE, 'Active'),
        (ENDED, 'Ended'),
        (MISSED, 'Missed'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='calls')
    initiated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='initiated_calls')
    call_type = models.CharField(max_length=12, choices=CALL_TYPE_CHOICES, default=VIDEO)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=RINGING)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.call_type} call #{self.pk}'


class CallSignal(models.Model):
    OFFER = 'OFFER'
    ANSWER = 'ANSWER'
    ICE = 'ICE'
    TYPE_CHOICES = (
        (OFFER, 'Offer'),
        (ANSWER, 'Answer'),
        (ICE, 'ICE Candidate'),
    )

    call = models.ForeignKey(CallSession, on_delete=models.CASCADE, related_name='signals')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_call_signals')
    signal_type = models.CharField(max_length=12, choices=TYPE_CHOICES)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'{self.signal_type} for call #{self.call_id}'


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f'{self.user.email} reacted {self.emoji} on #{self.message_id}'


class VoiceMessage(models.Model):
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='voice_message')
    audio_file = models.FileField(upload_to='voice_messages/', validators=[validate_safe_upload])
    duration = models.FloatField(default=0.0)
    waveform = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Voice for msg #{self.message_id} ({self.duration}s)'


class PinnedMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='pinned_messages')
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='pins')
    pinned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pinned_by_user')
    pinned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('conversation', 'message')

    def __str__(self):
        return f'Message #{self.message_id} pinned in conversation #{self.conversation_id}'


class Mention(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='mentions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mentions_received')
    mention_type = models.CharField(max_length=15, choices=(('USER', 'User'), ('EVERYONE', 'Everyone'), ('TEAM', 'Team')), default='USER')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} mentioned in message #{self.message_id}'


class PresenceStatus(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='presence')
    status = models.CharField(max_length=20, default='OFFLINE')  # ONLINE, OFFLINE, AWAY, DND
    custom_message = models.CharField(max_length=100, blank=True)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} is {self.status}'


class TypingStatus(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='typing_statuses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='typing_statuses')
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f'{self.user.email} typing in {self.conversation_id}: {self.is_typing}'


class MessageReceipt(models.Model):
    STATUS_CHOICES = (
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('SEEN', 'Seen'),
    )
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_receipts')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='SENT')
    timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('message', 'user')

    def __str__(self):
        return f'{self.user.email} - receipt {self.status} for #{self.message_id}'


class Device(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    device_type = models.CharField(max_length=20)  # DESKTOP, MOBILE, TABLET
    device_token = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} - {self.device_type}'


class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField()
    auth_key = models.CharField(max_length=255)
    p256dh_key = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Subscription for {self.user.email}'


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='communication_audit_logs')
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.action} by {self.user.email if self.user else "System"} at {self.created_at}'

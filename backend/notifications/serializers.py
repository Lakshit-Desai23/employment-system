from rest_framework import serializers
from authentication.serializers import UserSerializer
from .models import Notification, Reminder, NotificationSettings

class NotificationSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    recipient_details = UserSerializer(source='recipient', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'recipient_details', 'sender', 'sender_details',
            'title', 'message', 'is_read', 'is_archived', 'snoozed_until',
            'priority', 'category', 'type', 'project', 'task', 'conversation', 'created_at'
        )
        read_only_fields = (
            'id', 'recipient', 'recipient_details', 'sender', 'sender_details',
            'title', 'message', 'type', 'project', 'task', 'conversation', 'created_at'
        )


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ('id', 'user', 'title', 'message', 'alert_time', 'recurring', 'is_sent', 'created_at')
        read_only_fields = ('id', 'user', 'is_sent', 'created_at')


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = (
            'id', 'user', 'sound_enabled', 'sound_volume', 'sound_type',
            'desktop_enabled', 'email_enabled', 'push_enabled',
            'quiet_hours_start', 'quiet_hours_end',
            'working_hours_start', 'working_hours_end', 'dnd_enabled'
        )
        read_only_fields = ('id', 'user')


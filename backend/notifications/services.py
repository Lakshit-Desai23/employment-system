from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification, NotificationSettings
from .serializers import NotificationSerializer

class NotificationService:
    @staticmethod
    def send_notification(recipient, title, message, send_email=False, category='SYSTEM', priority='NORMAL', sender=None, project=None, task=None, conversation=None):
        """Create an in-app notification, check user DND settings, broadcast over WebSockets, and optionally email."""
        # 1. Check DND & Quiet hours settings
        settings_obj = NotificationSettings.objects.filter(user=recipient).first()
        is_dnd = False
        play_sound = True
        show_popup = True

        if settings_obj:
            if settings_obj.dnd_enabled:
                is_dnd = True
                play_sound = False
                show_popup = False
            else:
                now_time = timezone.localtime(timezone.now()).time()
                # Quiet hours check
                if settings_obj.quiet_hours_start and settings_obj.quiet_hours_end:
                    start = settings_obj.quiet_hours_start
                    end = settings_obj.quiet_hours_end
                    if start <= end:
                        if start <= now_time <= end:
                            is_dnd = True
                            play_sound = False
                            show_popup = False
                    else:  # crosses midnight
                        if now_time >= start or now_time <= end:
                            is_dnd = True
                            play_sound = False
                            show_popup = False

                # Working hours check (mute DND if outside working hours)
                if settings_obj.working_hours_start and settings_obj.working_hours_end:
                    w_start = settings_obj.working_hours_start
                    w_end = settings_obj.working_hours_end
                    if w_start <= w_end:
                        if not (w_start <= now_time <= w_end):
                            play_sound = False  # just mute sound outside working hours
                    else:  # crosses midnight
                        if not (now_time >= w_start or now_time <= w_end):
                            play_sound = False

            if not settings_obj.sound_enabled:
                play_sound = False

        # 2. Create In-App Notification record
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            title=title,
            message=message,
            category=category,
            priority=priority,
            project=project,
            task=task,
            conversation=conversation,
            type='IN_APP'
        )

        # 3. Broadcast WebSocket notification event
        channel_layer = get_channel_layer()
        if channel_layer:
            serialized_data = NotificationSerializer(notification).data
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    "type": "user_notification",
                    "notification": serialized_data,
                    "play_sound": play_sound,
                    "show_popup": show_popup,
                }
            )

        # 4. Trigger Email if specified and recipient has email enabled in settings
        email_allowed = settings_obj.email_enabled if settings_obj else True
        if send_email and recipient.email and email_allowed and not is_dnd:
            try:
                send_mail(
                    subject=title,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL or 'alerts@epm.com',
                    recipient_list=[recipient.email],
                    fail_silently=True
                )
                Notification.objects.create(
                    recipient=recipient,
                    sender=sender,
                    title=title,
                    message=message,
                    category=category,
                    priority=priority,
                    project=project,
                    task=task,
                    conversation=conversation,
                    type='EMAIL'
                )
            except Exception:
                pass

        return notification


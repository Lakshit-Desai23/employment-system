from django.db import models
from django.conf import settings
from .validators import validate_notification_content

class Notification(models.Model):
    TYPE_CHOICES = (
        ('IN_APP', 'In-App Notification'),
        ('EMAIL', 'Email Alert'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
    )

    CATEGORY_CHOICES = (
        ('MESSAGE', 'Message'),
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('TASK_UPDATED', 'Task Updated'),
        ('PROJECT_CREATED', 'Project Created'),
        ('PROJECT_UPDATED', 'Project Updated'),
        ('MENTION', 'Mention'),
        ('COMMENT', 'Comment'),
        ('APPROVAL', 'Approval Request'),
        ('REMINDER', 'Reminder'),
        ('MEETING', 'Meeting'),
        ('ANNOUNCEMENT', 'Announcement'),
        ('SYSTEM', 'System Alert'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField(validators=[validate_notification_content])
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    snoozed_until = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='SYSTEM')
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='IN_APP')
    
    # Optional relationships to avoid circular imports
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    conversation = models.ForeignKey('messaging.Conversation', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"


class Reminder(models.Model):
    RECURRING_CHOICES = (
        ('ONCE', 'Once'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders')
    title = models.CharField(max_length=160)
    message = models.TextField(blank=True)
    alert_time = models.DateTimeField()
    recurring = models.CharField(max_length=12, choices=RECURRING_CHOICES, default='ONCE')
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Reminder "{self.title}" for {self.user.email} at {self.alert_time}'


class NotificationSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings')
    sound_enabled = models.BooleanField(default=True)
    sound_volume = models.IntegerField(default=80)  # 0 to 100
    sound_type = models.CharField(max_length=30, default='default')
    desktop_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    working_hours_start = models.TimeField(null=True, blank=True)
    working_hours_end = models.TimeField(null=True, blank=True)
    dnd_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f'Settings for {self.user.email}'

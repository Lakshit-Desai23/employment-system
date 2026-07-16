from django.core.exceptions import ValidationError

def validate_notification_content(value):
    if len(value.strip()) == 0:
        raise ValidationError("Notification message cannot be blank.")

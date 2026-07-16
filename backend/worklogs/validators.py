from django.core.exceptions import ValidationError

def validate_work_hours(value):
    if value < 0 or value > 24:
        raise ValidationError("Work hours logged must be between 0 and 24.")

from django.core.exceptions import ValidationError

def validate_positive_hours(value):
    if value < 0:
        raise ValidationError("Hours cannot be negative.")

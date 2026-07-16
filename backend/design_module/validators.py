from django.core.exceptions import ValidationError

def validate_positive_count(value):
    if value <= 0:
        raise ValidationError("Screen count must be at least 1.")

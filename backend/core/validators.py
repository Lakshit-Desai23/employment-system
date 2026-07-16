from django.core.exceptions import ValidationError

def validate_name_length(value):
    if len(value) < 2:
        raise ValidationError("Name must be at least 2 characters long.")

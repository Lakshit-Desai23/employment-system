from django.core.exceptions import ValidationError

def validate_bug_description(value):
    if len(value) < 10:
        raise ValidationError("Bug description must explain the reproduction steps (at least 10 chars).")

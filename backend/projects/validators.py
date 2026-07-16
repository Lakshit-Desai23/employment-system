from django.core.exceptions import ValidationError

def validate_project_budget(value):
    if value < 0:
        raise ValidationError("Budget cannot be a negative amount.")

from django.core.exceptions import ValidationError

def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValidationError("End date must be after start date.")

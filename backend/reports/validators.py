from django.core.exceptions import ValidationError
import os

def validate_excel_extension(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.xlsx', '.xls']
    if not ext.lower() in valid_extensions:
        raise ValidationError("Unsupported file extension. Only Excel files (.xlsx, .xls) are allowed.")

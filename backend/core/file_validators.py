import os

from django.conf import settings
from django.core.exceptions import ValidationError


DEFAULT_ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt',
    '.png', '.jpg', '.jpeg', '.webp', '.gif',
    '.zip',
}


def validate_safe_upload(file_obj):
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
    allowed_extensions = getattr(settings, 'ALLOWED_UPLOAD_EXTENSIONS', DEFAULT_ALLOWED_EXTENSIONS)
    extension = os.path.splitext(file_obj.name or '')[1].lower()

    if extension not in allowed_extensions:
        raise ValidationError(f'File type {extension or "unknown"} is not allowed.')

    if file_obj.size and file_obj.size > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise ValidationError(f'File is too large. Maximum allowed size is {limit_mb} MB.')

from django.utils.text import slugify
from django.utils import timezone

def generate_report_filename(report_type, extension='xlsx'):
    """Generate a timestamped filename for report export."""
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    clean_type = slugify(report_type).lower()
    return f"report_{clean_type}_{timestamp}.{extension}"

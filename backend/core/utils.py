from django.utils.text import slugify

def format_department_code(name):
    """Generate a clean code from department name."""
    return slugify(name).upper()

import random
import string

def generate_project_code(name):
    """Generate a unique tracking code from project name."""
    clean_name = "".join(x for x in name if x.isalnum()).upper()
    prefix = clean_name[:4]
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"PRJ-{prefix}-{random_str}"

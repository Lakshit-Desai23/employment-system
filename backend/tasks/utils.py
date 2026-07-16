import os

def get_attachment_filename(attachment):
    """Retrieve clean filename from task attachment path."""
    return os.path.basename(attachment.file.name)

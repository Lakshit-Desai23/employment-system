def needs_client_review(design_task):
    """Check if design task is ready for approval review."""
    return design_task.status == 'PROTOTYPE' and design_task.approval_status == 'PENDING'

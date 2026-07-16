def get_blocking_bugs(dev_task):
    """Retrieve active critical/high severity bugs on a dev task."""
    return dev_task.bugs.filter(severity__in=['HIGH', 'CRITICAL']).exclude(status='CLOSED')

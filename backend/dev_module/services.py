# pyrefly: ignore [missing-import]
from django.db import transaction
from .models import Bug

class DevService:
    @staticmethod
    @transaction.atomic
    def report_bug(dev_task, title, description, severity, reported_by):
        """Report a new bug against a dev task and increment bug count."""
        bug = Bug.objects.create(
            dev_task=dev_task,
            title=title,
            description=description,
            severity=severity,
            status='NEW',
            reported_by=reported_by
        )
        
        # Increment active bug count on the development task
        dev_task.bug_count = dev_task.bugs.exclude(status='CLOSED').count()
        dev_task.save()
        return bug

    @staticmethod
    @transaction.atomic
    def update_bug_status(bug, new_status):
        """Transition bug status and update development task bug counter."""
        bug.status = new_status
        bug.save()

        dev_task = bug.dev_task
        dev_task.bug_count = dev_task.bugs.exclude(status='CLOSED').count()
        dev_task.save()
        return bug

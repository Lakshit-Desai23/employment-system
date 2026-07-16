from django.db import transaction
from .models import DesignRevision

class DesignService:
    @staticmethod
    @transaction.atomic
    def record_revision(design_task, feedback, changes_made):
        """Record a client/internal feedback iteration and update revision counts."""
        next_revision_num = design_task.revision_count + 1
        
        # Create revision object
        revision = DesignRevision.objects.create(
            design_task=design_task,
            revision_number=next_revision_num,
            feedback=feedback,
            changes_made=changes_made
        )

        # Update parent task details
        design_task.revision_count = next_revision_num
        design_task.approval_status = 'PENDING'
        design_task.save()
        
        return revision

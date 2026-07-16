from django.db import models
from tasks.models import Task
from .validators import validate_positive_count

class DesignTask(models.Model):
    STAGE_CHOICES = (
        ('WIREFRAME', 'Wireframe'),
        ('MOCKUP', 'Mockup'),
        ('PROTOTYPE', 'Prototype'),
        ('COMPLETED', 'Completed'),
    )

    APPROVAL_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='design_task')
    ui_screens_count = models.IntegerField(default=1, validators=[validate_positive_count])
    status = models.CharField(max_length=20, choices=STAGE_CHOICES, default='WIREFRAME')
    client_feedback = models.TextField(blank=True, null=True)
    approval_status = models.CharField(max_length=15, choices=APPROVAL_CHOICES, default='PENDING')
    revision_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Design Task for: {self.task.title}"

class DesignRevision(models.Model):
    design_task = models.ForeignKey(DesignTask, on_delete=models.CASCADE, related_name='revisions')
    revision_number = models.IntegerField()
    feedback = models.TextField()
    changes_made = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Revision {self.revision_number} of Design Task {self.design_task.id}"

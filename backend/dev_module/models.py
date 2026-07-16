from django.db import models
from django.conf import settings
from tasks.models import Task
from .validators import validate_bug_description

class DevTask(models.Model):
    DEV_TYPE_CHOICES = (
        ('API', 'API Development'),
        ('MOBILE', 'Mobile Development'),
        ('WEB', 'Web Development'),
    )

    TEST_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
    )

    DEPLOY_STATUS_CHOICES = (
        ('LOCAL', 'Local'),
        ('STAGING', 'Staging'),
        ('PRODUCTION', 'Production'),
    )

    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='dev_task')
    dev_type = models.CharField(max_length=15, choices=DEV_TYPE_CHOICES, default='WEB')
    test_status = models.CharField(max_length=15, choices=TEST_STATUS_CHOICES, default='PENDING')
    bug_count = models.IntegerField(default=0)
    deployment_status = models.CharField(max_length=15, choices=DEPLOY_STATUS_CHOICES, default='LOCAL')

    def __str__(self):
        return f"Dev Task for: {self.task.title}"

class Bug(models.Model):
    SEVERITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    STATUS_CHOICES = (
        ('NEW', 'New'),
        ('ASSIGNED', 'Assigned'),
        ('FIXED', 'Fixed'),
        ('CLOSED', 'Closed'),
    )

    dev_task = models.ForeignKey(DevTask, on_delete=models.CASCADE, related_name='bugs')
    title = models.CharField(max_length=150)
    description = models.TextField(validators=[validate_bug_description])
    severity = models.CharField(max_length=15, choices=SEVERITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='NEW')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='reported_bugs')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bug: {self.title} (Task: {self.dev_task.task.title})"

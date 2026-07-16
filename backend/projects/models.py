from django.db import models
from django.conf import settings
from employees.models import EmployeeProfile
from .validators import validate_project_budget

class Project(models.Model):
    STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
    )

    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='NOT_STARTED')
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, validators=[validate_project_budget])
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class ProjectAssignment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='project_assignments')
    role_in_project = models.CharField(max_length=100)
    assigned_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'employee')

    def __str__(self):
        return f"{self.employee.user.full_name} assigned to {self.project.name} as {self.role_in_project}"

from django.db import models
from django.conf import settings
from core.models import Department, Designation

class EmployeeProfile(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('RESIGNED', 'Resigned'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_joining = models.DateField(null=True, blank=True)
    skills = models.TextField(blank=True, null=True, help_text="Comma separated skills")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')

    def __str__(self):
        return f"{self.user.full_name} - {self.designation.name if self.designation else 'No Designation'}"

class WorkHistory(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='work_histories')
    previous_company = models.CharField(max_length=150)
    job_title = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.employee.user.full_name} at {self.previous_company}"

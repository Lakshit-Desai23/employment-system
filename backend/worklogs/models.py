from django.db import models
from django.utils import timezone
from employees.models import EmployeeProfile
from .validators import validate_work_hours

class DailyWorkLog(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='work_logs')
    date = models.DateField(default=timezone.now)
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0.00, validators=[validate_work_hours])
    notes = models.TextField()
    blockers = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Worklog - {self.employee.user.full_name} on {self.date}"

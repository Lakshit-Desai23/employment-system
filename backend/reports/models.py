from django.db import models
from django.conf import settings

class ReportLog(models.Model):
    REPORT_TYPES = (
        ('EMPLOYEE', 'Employee Report'),
        ('PROJECT', 'Project Report'),
        ('TASK', 'Task Report'),
        ('PERFORMANCE', 'Performance Analytics'),
    )

    FORMAT_CHOICES = (
        ('EXCEL', 'Excel Spreadsheet'),
        ('PDF', 'Portable Document Format'),
    )

    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.report_type} in {self.format} by {self.generated_by.email if self.generated_by else 'Unknown'}"

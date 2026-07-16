from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ReportLog

@receiver(post_save, sender=ReportLog)
def report_log_saved(sender, instance, created, **kwargs):
    if created:
        # Action like log monitoring analytics or security audits
        pass

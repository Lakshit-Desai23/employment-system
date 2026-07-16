from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DailyWorkLog

@receiver(post_save, sender=DailyWorkLog)
def worklog_saved(sender, instance, created, **kwargs):
    if created:
        # e.g., trigger automatic updates in performance reports
        pass

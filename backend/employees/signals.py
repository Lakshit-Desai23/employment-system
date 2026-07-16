from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import EmployeeProfile

@receiver(post_delete, sender=EmployeeProfile)
def employee_profile_deleted(sender, instance, **kwargs):
    # If employee profile is deleted, we can clean up user account or audit
    pass

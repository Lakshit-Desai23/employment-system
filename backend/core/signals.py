from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Department, Designation

@receiver(post_save, sender=Department)
def department_created(sender, instance, created, **kwargs):
    if created:
        # Example signal action: Log or trigger background jobs
        pass

@receiver(post_save, sender=Designation)
def designation_created(sender, instance, created, **kwargs):
    if created:
        pass

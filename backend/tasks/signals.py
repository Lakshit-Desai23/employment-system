from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task

@receiver(post_save, sender=Task)
def task_saved(sender, instance, created, **kwargs):
    if created:
        # e.g., trigger in-app notification when task is assigned
        pass

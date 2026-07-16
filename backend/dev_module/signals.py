from django.db.models.signals import post_save
from django.dispatch import receiver
from tasks.models import Task
from .models import DevTask

@receiver(post_save, sender=Task)
def auto_create_dev_task(sender, instance, created, **kwargs):
    if created and instance.assigned_to and instance.assigned_to.role == 'DEVELOPER':
        DevTask.objects.get_or_create(task=instance)

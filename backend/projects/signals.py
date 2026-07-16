from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ProjectAssignment

@receiver(post_save, sender=ProjectAssignment)
def assignment_saved(sender, instance, created, **kwargs):
    if created:
        # Action like auto-creating onboarding tasks, notify, etc.
        pass

@receiver(post_delete, sender=ProjectAssignment)
def assignment_deleted(sender, instance, **kwargs):
    pass

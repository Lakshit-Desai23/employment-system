from .models import Task

class TaskService:
    @staticmethod
    def update_task_status(task, new_status):
        """Update task status securely."""
        task.status = new_status
        task.save()
        return task

    @staticmethod
    def log_hours(task, hours):
        """Log actual hours spent on the task."""
        task.act_hours += hours
        task.save()
        return task

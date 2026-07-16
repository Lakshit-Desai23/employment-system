from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from tasks.models import Task
from tasks.services import TaskService
import datetime

User = get_user_model()

class TasksTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="developer@epm.com",
            password="securePassword123",
            first_name="Alice",
            last_name="Smith"
        )
        self.project = Project.objects.create(
            name="Epm Project",
            code="EPM-001",
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 12, 31),
            created_by=self.user
        )
        self.task = Task.objects.create(
            project=self.project,
            assigned_to=self.user,
            title="Design DB Schema",
            description="Create tables",
            priority="HIGH",
            status="TODO",
            est_hours=10.00,
            created_by=self.user
        )

    def test_create_task(self):
        self.assertEqual(self.task.title, "Design DB Schema")
        self.assertEqual(self.task.est_hours, 10.00)

    def test_update_status(self):
        updated_task = TaskService.update_task_status(self.task, "IN_PROGRESS")
        self.assertEqual(updated_task.status, "IN_PROGRESS")

    def test_log_hours(self):
        updated_task = TaskService.log_hours(self.task, 4.5)
        self.assertEqual(updated_task.act_hours, 4.5)

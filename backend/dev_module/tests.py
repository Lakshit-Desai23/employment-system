from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from tasks.models import Task
from dev_module.models import DevTask, Bug
from dev_module.services import DevService
import datetime

User = get_user_model()

class DevModuleTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="developer@epm.com",
            password="securePassword123",
            first_name="David",
            last_name="Developer"
        )
        self.project = Project.objects.create(
            name="Cloud Migration",
            code="PRJ-CLD",
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 12, 31),
            created_by=self.user
        )
        self.task = Task.objects.create(
            project=self.project,
            assigned_to=self.user,
            title="Deploy Backend Service Container",
            created_by=self.user
        )
        self.dev_task = DevTask.objects.create(
            task=self.task,
            dev_type='API',
            test_status='PENDING',
            deployment_status='LOCAL'
        )

    def test_dev_task_creation(self):
        self.assertEqual(self.dev_task.dev_type, 'API')
        self.assertEqual(self.dev_task.deployment_status, 'LOCAL')

    def test_report_bug_service(self):
        bug = DevService.report_bug(
            self.dev_task,
            title="Docker Compose port binding clash",
            description="The port 8000 is already in use by another container process.",
            severity="HIGH",
            reported_by=self.user
        )
        self.assertEqual(bug.title, "Docker Compose port binding clash")
        self.assertEqual(self.dev_task.bug_count, 1)
        
        # Test updating bug status to Fixed (counter updates)
        DevService.update_bug_status(bug, "CLOSED")
        self.dev_task.refresh_from_db()
        self.assertEqual(self.dev_task.bug_count, 0)
        self.assertEqual(bug.status, "CLOSED")

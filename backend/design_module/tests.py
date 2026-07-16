from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from tasks.models import Task
from design_module.models import DesignTask, DesignRevision
from design_module.services import DesignService
import datetime

User = get_user_model()

class DesignModuleTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="designer@epm.com",
            password="securePassword123",
            first_name="Drew",
            last_name="Designer"
        )
        self.project = Project.objects.create(
            name="Mobile App Design",
            code="PRJ-DES",
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 30),
            created_by=self.user
        )
        self.task = Task.objects.create(
            project=self.project,
            assigned_to=self.user,
            title="Create Figma Prototypes",
            created_by=self.user
        )
        self.design_task = DesignTask.objects.create(
            task=self.task,
            ui_screens_count=5,
            status='WIREFRAME',
            approval_status='PENDING'
        )

    def test_design_task_creation(self):
        self.assertEqual(self.design_task.ui_screens_count, 5)
        self.assertEqual(self.design_task.status, 'WIREFRAME')

    def test_record_revision(self):
        revision = DesignService.record_revision(
            self.design_task,
            feedback="Add a darker background contrast.",
            changes_made="Modified Figma frame colors to dark themes."
        )
        self.assertEqual(revision.revision_number, 1)
        self.assertEqual(self.design_task.revision_count, 1)
        self.assertEqual(self.design_task.approval_status, 'PENDING')

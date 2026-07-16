from django.test import TestCase
from django.contrib.auth import get_user_model
from employees.models import EmployeeProfile
from projects.models import Project, ProjectAssignment
from projects.services import ProjectService
import datetime

User = get_user_model()

class ProjectsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="manager@epm.com",
            password="securePassword123",
            first_name="Jane",
            last_name="Doe",
            role="MANAGER"
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            phone="0987654321",
            status="ACTIVE"
        )
        self.project = Project.objects.create(
            name="E-Commerce App",
            code="PRJ-101",
            description="Online store building",
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 12, 31),
            budget=50000.00,
            created_by=self.user
        )

    def test_create_project(self):
        self.assertEqual(self.project.code, "PRJ-101")
        self.assertEqual(self.project.budget, 50000.00)

    def test_assign_employee(self):
        assignment = ProjectService.assign_employee_to_project(
            project=self.project,
            employee=self.employee,
            role_in_project="Backend Tech Lead"
        )
        self.assertEqual(assignment.project, self.project)
        self.assertEqual(assignment.employee, self.employee)
        self.assertEqual(assignment.role_in_project, "Backend Tech Lead")
        
        # Test update assignment role
        ProjectService.assign_employee_to_project(
            project=self.project,
            employee=self.employee,
            role_in_project="Fullstack Architect"
        )
        assignment.refresh_from_db()
        self.assertEqual(assignment.role_in_project, "Fullstack Architect")

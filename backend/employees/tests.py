from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Department, Designation
from employees.models import EmployeeProfile
from employees.services import EmployeeService

User = get_user_model()

class EmployeeProfileTestCase(TestCase):
    def setUp(self):
        self.dept = Department.objects.create(name="Product Dev")
        self.desig = Designation.objects.create(name="Team Lead")

    def test_employee_creation_service(self):
        data = {
            'email': "lead@epm.com",
            'first_name': "Bob",
            'last_name': "Jones",
            'role': "MANAGER",
            'department': self.dept,
            'designation': self.desig,
            'phone': "1234567890",
            'status': "ACTIVE"
        }
        profile = EmployeeService.create_employee(data)
        self.assertEqual(profile.user.email, "lead@epm.com")
        self.assertEqual(profile.user.role, "MANAGER")
        self.assertEqual(profile.department, self.dept)
        self.assertEqual(profile.designation, self.desig)
        self.assertEqual(profile.status, "ACTIVE")

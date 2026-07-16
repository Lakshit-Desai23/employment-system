from django.test import TestCase
from django.contrib.auth import get_user_model
from employees.models import EmployeeProfile
from worklogs.models import DailyWorkLog
from worklogs.services import WorkLogService
import datetime

User = get_user_model()

class WorklogsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="employee@epm.com",
            password="securePassword123",
            first_name="General",
            last_name="Worker"
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            phone="1122334455",
            status="ACTIVE"
        )

    def test_duration_calculator(self):
        start = datetime.time(9, 0)
        end = datetime.time(17, 30)
        duration = WorkLogService.calculate_duration(start, end)
        self.assertEqual(duration, 8.5)

    def test_create_worklog(self):
        log = DailyWorkLog.objects.create(
            employee=self.employee,
            date=datetime.date.today(),
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
            total_hours=8.00,
            notes="Completed task tickets and pushed code.",
            blockers="None"
        )
        self.assertEqual(log.total_hours, 8.00)
        self.assertEqual(str(log), f"Worklog - General Worker on {datetime.date.today()}")

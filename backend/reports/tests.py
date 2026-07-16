from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ReportLog

User = get_user_model()

class ReportsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="auditor@epm.com",
            password="securePassword123",
            first_name="Arthur",
            last_name="Auditor",
            role="ADMIN"
        )

    def test_create_report_log(self):
        log = ReportLog.objects.create(
            generated_by=self.user,
            report_type='PROJECT',
            format='EXCEL'
        )
        self.assertEqual(log.report_type, 'PROJECT')
        self.assertEqual(log.format, 'EXCEL')
        self.assertEqual(log.generated_by, self.user)
        self.assertIn("PROJECT in EXCEL", str(log))

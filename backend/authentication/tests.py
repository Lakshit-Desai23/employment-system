from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()

class UserAuthenticationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="developer@epm.com",
            password="securePassword123",
            first_name="Alice",
            last_name="Smith",
            role="DEVELOPER"
        )

    def test_create_user(self):
        self.assertEqual(self.user.email, "developer@epm.com")
        self.assertTrue(self.user.check_password("securePassword123"))
        self.assertEqual(self.user.role, "DEVELOPER")
        self.assertEqual(self.user.full_name, "Alice Smith")

    def test_create_superuser(self):
        superuser = User.objects.create_superuser(
            email="admin@epm.com",
            password="adminPassword123",
            first_name="Admin",
            last_name="User"
        )
        self.assertEqual(superuser.role, "ADMIN")
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

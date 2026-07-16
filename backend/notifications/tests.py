from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Notification
from .services import NotificationService

User = get_user_model()

class NotificationsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="recipient@epm.com",
            password="securePassword123",
            first_name="Ryan",
            last_name="Recipient"
        )

    def test_send_in_app_notification(self):
        notification = NotificationService.send_notification(
            recipient=self.user,
            title="Task Assigned",
            message="You have been assigned to Project Setup."
        )
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "Task Assigned")
        self.assertEqual(notification.type, 'IN_APP')
        self.assertFalse(notification.is_read)

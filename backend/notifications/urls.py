from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, ReminderViewSet, NotificationSettingsViewSet

router = DefaultRouter()
router.register('logs', NotificationViewSet, basename='notification')
router.register('reminders', ReminderViewSet, basename='reminder')
router.register('settings', NotificationSettingsViewSet, basename='notification-settings')

urlpatterns = [
    path('', include(router.urls)),
]

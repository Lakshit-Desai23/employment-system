from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Notification, Reminder, NotificationSettings
from .serializers import NotificationSerializer, ReminderSerializer, NotificationSettingsSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_read', 'is_archived', 'category', 'priority']

    def get_queryset(self):
        # Filter notifications: recipient is user, not archived by default unless requested, and not snoozed currently
        qs = Notification.objects.filter(recipient=self.request.user)
        
        # Filter out currently snoozed notifications
        now = timezone.now()
        qs = qs.filter(Q(snoozed_until__isnull=True) | Q(snoozed_until__lt=now))
        
        return qs.order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='snooze')
    def snooze(self, request, pk=None):
        notification = self.get_object()
        minutes = int(request.data.get('minutes', 15))
        notification.snoozed_until = timezone.now() + timedelta(minutes=minutes)
        notification.save(update_fields=['snoozed_until'])
        return Response({"detail": f"Notification snoozed for {minutes} minutes."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        notification = self.get_object()
        notification.is_archived = True
        notification.save(update_fields=['is_archived'])
        return Response({"detail": "Notification archived."}, status=status.HTTP_200_OK)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user).order_by('alert_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NotificationSettingsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings_obj, _ = NotificationSettings.objects.get_or_create(user=self.request.user)
        return settings_obj

    def list(self, request):
        settings_obj = self.get_object()
        serializer = NotificationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def create(self, request):
        settings_obj = self.get_object()
        serializer = NotificationSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


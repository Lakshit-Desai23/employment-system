from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import DevTask, Bug
from .serializers import DevTaskSerializer, BugSerializer
from .services import DevService

class DevTaskViewSet(viewsets.ModelViewSet):
    queryset = DevTask.objects.all().select_related('task__project', 'task__assigned_to')
    serializer_class = DevTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['dev_type', 'test_status', 'deployment_status', 'task__project']

class BugViewSet(viewsets.ModelViewSet):
    queryset = Bug.objects.all().select_related('dev_task__task', 'reported_by')
    serializer_class = BugSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['dev_task', 'severity', 'status']

    def perform_create(self, serializer):
        dev_task = serializer.validated_data['dev_task']
        bug = DevService.report_bug(
            dev_task=dev_task,
            title=serializer.validated_data['title'],
            description=serializer.validated_data['description'],
            severity=serializer.validated_data['severity'],
            reported_by=self.request.user
        )
        serializer.instance = bug

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        new_status = serializer.validated_data.get('status', old_status)
        if old_status != new_status:
            bug = DevService.update_bug_status(serializer.instance, new_status)
            serializer.instance = bug
        else:
            serializer.save()

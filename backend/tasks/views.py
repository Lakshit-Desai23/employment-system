from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Task, TaskAttachment
from .serializers import TaskSerializer, TaskAttachmentSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related('project', 'assigned_to', 'created_by').prefetch_related('attachments')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'assigned_to', 'priority', 'status']
    search_fields = ['title', 'description', 'remarks']
    ordering_fields = ['due_date', 'priority', 'status', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TaskAttachmentViewSet(viewsets.ModelViewSet):
    queryset = TaskAttachment.objects.all()
    serializer_class = TaskAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        attachment = self.get_object()
        return FileResponse(
            attachment.file.open('rb'),
            as_attachment=True,
            filename=attachment.file.name.split('/')[-1],
        )

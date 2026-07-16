from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import DesignTask, DesignRevision
from .serializers import DesignTaskSerializer, DesignRevisionSerializer
from .services import DesignService

class DesignTaskViewSet(viewsets.ModelViewSet):
    queryset = DesignTask.objects.all().select_related('task__project', 'task__assigned_to')
    serializer_class = DesignTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'approval_status', 'task__project']

    @action(detail=True, methods=['post'], url_path='add-revision')
    def add_revision(self, request, pk=None):
        design_task = self.get_object()
        feedback = request.data.get('feedback')
        changes_made = request.data.get('changes_made')

        if not feedback or not changes_made:
            return Response(
                {"detail": "Both 'feedback' and 'changes_made' are required parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        revision = DesignService.record_revision(design_task, feedback, changes_made)
        return Response(DesignRevisionSerializer(revision).data, status=status.HTTP_201_CREATED)

class DesignRevisionViewSet(viewsets.ModelViewSet):
    queryset = DesignRevision.objects.all()
    serializer_class = DesignRevisionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['design_task']

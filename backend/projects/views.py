from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from authentication.permissions import IsAdminOrReadOnly
from .models import Project, ProjectAssignment
from .serializers import ProjectSerializer, ProjectAssignmentSerializer
from .services import ProjectService

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().prefetch_related('tasks', 'assignments__employee__user')
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'created_by']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['start_date', 'end_date', 'budget', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssignment.objects.all().select_related('project', 'employee__user')
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'employee']

    def create(self, request, *args, **kwargs):
        # Allow bulk or custom assignment
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = ProjectService.assign_employee_to_project(
            project=serializer.validated_data['project'],
            employee=serializer.validated_data['employee'],
            role_in_project=serializer.validated_data['role_in_project']
        )
        return Response(ProjectAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from authentication.permissions import IsAdminOrReadOnly, IsSelfOrAdminOrManager
from .models import EmployeeProfile, WorkHistory
from .serializers import EmployeeProfileSerializer, WorkHistorySerializer
from .services import EmployeeService

class EmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = EmployeeProfile.objects.all().select_related('user', 'department', 'designation')
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'designation', 'status', 'user__role']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'department__name', 'designation__name']
    ordering_fields = ['user__email', 'date_of_joining', 'status']

    def get_permissions(self):
        # Allow users to retrieve their own profiles, but only managers can create/delete
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [IsSelfOrAdminOrManager()]
        return super().get_permissions()

    def perform_create(self, serializer):
        profile = EmployeeService.create_employee(serializer.validated_data)
        serializer.instance = profile

    def perform_update(self, serializer):
        profile = EmployeeService.update_employee(serializer.instance, serializer.validated_data)
        serializer.instance = profile

class WorkHistoryViewSet(viewsets.ModelViewSet):
    queryset = WorkHistory.objects.all()
    serializer_class = WorkHistorySerializer
    permission_classes = [IsSelfOrAdminOrManager]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee']

    def perform_create(self, serializer):
        # Verify permissions
        employee = serializer.validated_data['employee']
        self.check_object_permissions(self.request, employee)
        serializer.save()

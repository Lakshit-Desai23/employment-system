from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from authentication.permissions import IsSelfOrAdminOrManager
from .models import DailyWorkLog
from .serializers import DailyWorkLogSerializer
from .services import WorkLogService

class DailyWorkLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyWorkLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdminOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'date']
    search_fields = ['notes', 'blockers', 'employee__user__first_name', 'employee__user__last_name']
    ordering_fields = ['date', 'total_hours']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'MANAGER']:
            return DailyWorkLog.objects.all().select_related('employee__user')
        # Regular employees can only see their own logs
        return DailyWorkLog.objects.filter(employee__user=user).select_related('employee__user')

    def perform_create(self, serializer):
        # Auto-compute total_hours if not supplied or set to 0
        total_hours = serializer.validated_data.get('total_hours', 0)
        if total_hours == 0:
            start_time = serializer.validated_data.get('start_time')
            end_time = serializer.validated_data.get('end_time')
            total_hours = WorkLogService.calculate_duration(start_time, end_time)
            serializer.validated_data['total_hours'] = total_hours
        
        # Check permissions on the profile being created
        employee = serializer.validated_data['employee']
        if self.request.user.role not in ['ADMIN', 'MANAGER'] and employee.user != self.request.user:
            raise permissions.exceptions.PermissionDenied("You cannot create a worklog for another employee.")
            
        serializer.save()

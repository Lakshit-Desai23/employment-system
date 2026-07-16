from rest_framework import serializers
from employees.serializers import EmployeeProfileSerializer
from .models import Project, ProjectAssignment

class ProjectAssignmentSerializer(serializers.ModelSerializer):
    employee_details = EmployeeProfileSerializer(source='employee', read_only=True)

    class Meta:
        model = ProjectAssignment
        fields = ('id', 'project', 'employee', 'employee_details', 'role_in_project', 'assigned_date')
        read_only_fields = ('assigned_date',)

class ProjectSerializer(serializers.ModelSerializer):
    assignments = ProjectAssignmentSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'code', 'description', 'start_date', 'end_date',
            'status', 'budget', 'created_by', 'created_by_name', 'created_at',
            'assignments', 'progress_percentage'
        )
        read_only_fields = ('created_by', 'created_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.role != 'ADMIN':
            self.fields.pop('budget', None)

    def get_progress_percentage(self, obj):
        # Calculate task completion rate dynamically
        # Since tasks is a related model, we count total vs completed
        tasks = obj.tasks.all()
        total_tasks = tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = tasks.filter(status='COMPLETED').count()
        return round((completed_tasks / total_tasks) * 100, 2)

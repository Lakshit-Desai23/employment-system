from rest_framework import serializers
from .models import DevTask, Bug

class BugSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)

    class Meta:
        model = Bug
        fields = ('id', 'dev_task', 'title', 'description', 'severity', 'status', 'reported_by', 'reported_by_name', 'created_at')
        read_only_fields = ('reported_by', 'created_at')

class DevTaskSerializer(serializers.ModelSerializer):
    bugs = BugSerializer(many=True, read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='task.project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='task.assigned_to.full_name', read_only=True)

    class Meta:
        model = DevTask
        fields = (
            'id', 'task', 'task_title', 'project_name', 'assigned_to_name',
            'dev_type', 'test_status', 'bug_count', 'deployment_status', 'bugs'
        )

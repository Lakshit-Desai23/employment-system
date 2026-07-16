from rest_framework import serializers
from .models import DesignTask, DesignRevision

class DesignRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignRevision
        fields = '__all__'

class DesignTaskSerializer(serializers.ModelSerializer):
    revisions = DesignRevisionSerializer(many=True, read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='task.project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='task.assigned_to.full_name', read_only=True)

    class Meta:
        model = DesignTask
        fields = (
            'id', 'task', 'task_title', 'project_name', 'assigned_to_name',
            'ui_screens_count', 'status', 'client_feedback', 'approval_status',
            'revision_count', 'revisions'
        )

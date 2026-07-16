from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from projects.models import Project
from .models import Task, TaskAttachment

User = get_user_model()

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ('id', 'task', 'file', 'uploaded_at', 'uploaded_by', 'uploaded_by_name')
        read_only_fields = ('uploaded_by', 'uploaded_at')

    def validate_file(self, value):
        try:
            for validator in TaskAttachment._meta.get_field('file').validators:
                validator(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value

class TaskSerializer(serializers.ModelSerializer):
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    # Writeable foreign keys
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'project_name', 'assigned_to', 'assigned_to_name',
            'title', 'description', 'priority', 'status', 'due_date',
            'est_hours', 'act_hours', 'remarks', 'created_by', 'created_by_name',
            'created_at', 'attachments'
        )
        read_only_fields = ('created_by', 'created_at')

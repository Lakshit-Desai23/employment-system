from django.contrib import admin
from .models import Task, TaskAttachment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'project', 'assigned_to', 'priority', 'status', 'due_date')
    list_filter = ('priority', 'status', 'project')
    search_fields = ('title', 'description')

@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'file', 'uploaded_at', 'uploaded_by')
    search_fields = ('task__title', 'file')

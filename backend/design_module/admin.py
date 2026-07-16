from django.contrib import admin
from .models import DesignTask, DesignRevision

@admin.register(DesignTask)
class DesignTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'ui_screens_count', 'status', 'approval_status', 'revision_count')
    list_filter = ('status', 'approval_status')
    search_fields = ('task__title', 'client_feedback')

@admin.register(DesignRevision)
class DesignRevisionAdmin(admin.ModelAdmin):
    list_display = ('id', 'design_task', 'revision_number', 'date')
    list_filter = ('date',)
    search_fields = ('feedback', 'changes_made')

from django.contrib import admin
from .models import DevTask, Bug

@admin.register(DevTask)
class DevTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'dev_type', 'test_status', 'bug_count', 'deployment_status')
    list_filter = ('dev_type', 'test_status', 'deployment_status')
    search_fields = ('task__title',)

@admin.register(Bug)
class BugAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'dev_task', 'severity', 'status', 'reported_by', 'created_at')
    list_filter = ('severity', 'status')
    search_fields = ('title', 'description')

from django.contrib import admin
from .models import Project, ProjectAssignment

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'status', 'start_date', 'end_date', 'budget')
    list_filter = ('status', 'start_date')
    search_fields = ('name', 'code')

@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'employee', 'role_in_project', 'assigned_date')
    list_filter = ('role_in_project',)
    search_fields = ('project__name', 'employee__user__email')

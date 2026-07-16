from django.contrib import admin
from .models import EmployeeProfile, WorkHistory

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'department', 'designation', 'phone', 'status')
    list_filter = ('status', 'department', 'designation')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')

@admin.register(WorkHistory)
class WorkHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'previous_company', 'job_title', 'start_date', 'end_date')
    search_fields = ('employee__user__email', 'previous_company')

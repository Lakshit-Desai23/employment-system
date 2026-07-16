from django.contrib import admin
from .models import DailyWorkLog

@admin.register(DailyWorkLog)
class DailyWorkLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'start_time', 'end_time', 'total_hours')
    list_filter = ('date', 'employee')
    search_fields = ('employee__user__email', 'notes')

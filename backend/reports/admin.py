from django.contrib import admin
from .models import ReportLog

@admin.register(ReportLog)
class ReportLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'report_type', 'format', 'generated_by', 'created_at')
    list_filter = ('report_type', 'format')
    search_fields = ('generated_by__email',)
    ordering = ('-created_at',)

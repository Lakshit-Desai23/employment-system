from rest_framework import serializers
from .models import ReportLog

class ReportLogSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True)

    class Meta:
        model = ReportLog
        fields = ('id', 'generated_by', 'generated_by_name', 'report_type', 'format', 'created_at')
        read_only_fields = ('generated_by', 'created_at')

from rest_framework import serializers
from .models import DailyWorkLog

class DailyWorkLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)

    class Meta:
        model = DailyWorkLog
        fields = ('id', 'employee', 'employee_name', 'date', 'start_time', 'end_time', 'total_hours', 'notes', 'blockers')

from rest_framework import serializers
from .models import Department, Designation, Company
import re

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('theme_json', 'updated_date')

    def validate_hex_color(self, val):
        if val:
            if not re.match(r'^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$', val):
                raise serializers.ValidationError("Must be a valid hex color code (e.g. #1e40af)")
        return val

    def validate_primary_color(self, value):
        return self.validate_hex_color(value)

    def validate_secondary_color(self, value):
        return self.validate_hex_color(value)

    def validate_accent_color(self, value):
        return self.validate_hex_color(value)


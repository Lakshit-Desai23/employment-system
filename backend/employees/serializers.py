from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer
from core.models import Department, Designation
from core.serializers import DepartmentSerializer, DesignationSerializer
from .models import EmployeeProfile, WorkHistory

User = get_user_model()

class WorkHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkHistory
        fields = '__all__'

class EmployeeProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    designation_details = DesignationSerializer(source='designation', read_only=True)
    
    # Writeable foreign keys
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=True, required=False, allow_null=True
    )
    designation = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(), write_only=True, required=False, allow_null=True
    )
    
    # Writeable user data fields to create/update user and profile at once
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = EmployeeProfile
        fields = (
            'id', 'user_details', 'department_details', 'designation_details',
            'department', 'designation', 'phone', 'address', 'date_of_joining',
            'skills', 'status', 'email', 'first_name', 'last_name', 'role', 'password'
        )

    def validate(self, attrs):
        # Additional custom validation (e.g. check duplicate email on create)
        email = attrs.get('email')
        if email and not self.instance:
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})
        return attrs

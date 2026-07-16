from django.db import transaction
from django.contrib.auth import get_user_model
from authentication.services import UserService
from .models import EmployeeProfile

User = get_user_model()

class EmployeeService:
    @staticmethod
    @transaction.atomic
    def create_employee(validated_data):
        """Register a user and associate an employee profile."""
        email = validated_data.pop('email')
        password = validated_data.pop('password', 'TempPassword123!')  # default password
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        role = validated_data.pop('role', 'EMPLOYEE')

        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        user.is_temporary_password = True
        user.save(update_fields=['is_temporary_password'])

        # Create profile
        profile = EmployeeProfile.objects.create(user=user, **validated_data)
        UserService.send_temporary_password_email(user, password, reason='invite')
        return profile

    @staticmethod
    @transaction.atomic
    def update_employee(profile, validated_data):
        """Update employee profile and nested user model information."""
        user = profile.user
        
        # Extract user fields
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        if email:
            user.email = email
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if role:
            user.role = role
        if password:
            user.set_password(password)
        
        user.save()

        # Update remaining profile fields
        for attr, value in validated_data.items():
            setattr(profile, attr, value)
        
        profile.save()
        return profile

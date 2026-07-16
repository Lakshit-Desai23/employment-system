from .models import Department, Designation

class CoreService:
    @staticmethod
    def create_department(name, description=None):
        """Business logic for creating a new department."""
        # Custom logic like sending notifications, auditing, etc. can go here
        return Department.objects.create(name=name, description=description)

    @staticmethod
    def create_designation(name, description=None):
        """Business logic for creating a new designation."""
        return Designation.objects.create(name=name, description=description)

from .models import ProjectAssignment

class ProjectService:
    @staticmethod
    def assign_employee_to_project(project, employee, role_in_project):
        """Transactionally assign an employee to a project with a custom role."""
        assignment, created = ProjectAssignment.objects.get_or_create(
            project=project,
            employee=employee,
            defaults={'role_in_project': role_in_project}
        )
        if not created:
            # Update the role if assignment already exists
            assignment.role_in_project = role_in_project
            assignment.save()
        return assignment

    @staticmethod
    def remove_employee_from_project(project, employee):
        """Unassign an employee from a project."""
        ProjectAssignment.objects.filter(project=project, employee=employee).delete()

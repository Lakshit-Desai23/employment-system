from rest_framework import permissions

class CanAccessReports(permissions.BasePermission):
    """Only admins and project managers can download reports or trigger excel imports."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'MANAGER']

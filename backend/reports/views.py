from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.http import FileResponse
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from projects.models import Project
from employees.models import EmployeeProfile
from tasks.models import Task
from worklogs.models import DailyWorkLog
from .models import ReportLog
from .serializers import ReportLogSerializer
from .services import ExcelImportExportService
from .permissions import CanAccessReports
from datetime import datetime

class ImportExcelView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessReports]

    def post(self, request):
        import_type = request.query_params.get('type')
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"detail": "No file was uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if import_type == 'projects':
                imported, updated = ExcelImportExportService.import_projects(file_obj)
            elif import_type == 'employees':
                imported, updated = ExcelImportExportService.import_employees(file_obj)
            elif import_type == 'tasks':
                imported, updated = ExcelImportExportService.import_tasks(file_obj)
            else:
                return Response({"detail": "Invalid type parameter. Choose from 'projects', 'employees', 'tasks'."}, status=status.HTTP_400_BAD_REQUEST)

            # Record Log
            ReportLog.objects.create(
                generated_by=request.user,
                report_type=import_type.upper()[:-1] + '_REPORT' if import_type.endswith('s') else 'TASK_REPORT',
                format='EXCEL'
            )

            return Response({
                "detail": f"Excel import successful.",
                "imported_records": imported,
                "updated_records": updated
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Import failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ExportProjectsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessReports]

    def get(self, request):
        buffer = ExcelImportExportService.export_projects_to_excel()
        ReportLog.objects.create(generated_by=request.user, report_type='PROJECT', format='EXCEL')
        return FileResponse(
            buffer,
            as_attachment=True,
            filename='epm_projects.xlsx',
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

class ExportEmployeesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessReports]

    def get(self, request):
        buffer = ExcelImportExportService.export_employees_to_excel()
        ReportLog.objects.create(generated_by=request.user, report_type='EMPLOYEE', format='EXCEL')
        return FileResponse(
            buffer,
            as_attachment=True,
            filename='epm_employees.xlsx',
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

class ExportTasksView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, CanAccessReports]

    def get(self, request):
        buffer = ExcelImportExportService.export_tasks_to_excel()
        ReportLog.objects.create(generated_by=request.user, report_type='TASK', format='EXCEL')
        return FileResponse(
            buffer,
            as_attachment=True,
            filename='epm_tasks.xlsx',
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

class DashboardMetricsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Aggregate data to supply dashboard metrics, progress stats, and trends."""
        total_projects = Project.objects.count()
        total_employees = EmployeeProfile.objects.filter(status='ACTIVE').count()
        
        tasks_qs = Task.objects.all()
        total_tasks = tasks_qs.count()
        
        # Task statuses
        pending_tasks = tasks_qs.exclude(status='COMPLETED').count()
        completed_tasks = tasks_qs.filter(status='COMPLETED').count()
        in_progress_tasks = tasks_qs.filter(status='IN_PROGRESS').count()
        todo_tasks = tasks_qs.filter(status='TODO').count()

        # Logs statistics
        today = timezone.now().date()
        today_worklogs = DailyWorkLog.objects.filter(date=today)
        today_hours = today_worklogs.aggregate(Sum('total_hours'))['total_hours__sum'] or 0.00

        # Weekly/Monthly logged hours trends
        start_of_week = today - timedelta(days=today.weekday())
        weekly_hours = DailyWorkLog.objects.filter(date__gte=start_of_week).aggregate(Sum('total_hours'))['total_hours__sum'] or 0.00

        start_of_month = today.replace(day=1)
        monthly_hours = DailyWorkLog.objects.filter(date__gte=start_of_month).aggregate(Sum('total_hours'))['total_hours__sum'] or 0.00

        # Recent activities log (latest projects and work logs)
        recent_projects = Project.objects.order_by('-created_at')[:5]
        recent_worklogs = DailyWorkLog.objects.order_by('-date', '-id')[:5]
        
        activities = []
        for rp in recent_projects:
            activities.append({
                'type': 'PROJECT',
                'title': f"Project Created: {rp.name}",
                'time': rp.created_at,
                'detail': f"Project Code: {rp.code}"
            })
        for wl in recent_worklogs:
            activities.append({
                'type': 'WORKLOG',
                'title': f"Work logged by {wl.employee.user.full_name}",
                'time': timezone.make_aware(datetime.combine(wl.date, wl.start_time)),
                'detail': f"Logged {wl.total_hours} hours. Notes: {wl.notes[:30]}..."
            })
        
        # Sort activities by newest
        activities = sorted(activities, key=lambda x: x['time'], reverse=True)[:8]

        return Response({
            'total_projects': total_projects,
            'total_employees': total_employees,
            'total_tasks': total_tasks,
            'pending_tasks': pending_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'todo_tasks': todo_tasks,
            'today_hours': float(today_hours),
            'weekly_hours': float(weekly_hours),
            'monthly_hours': float(monthly_hours),
            'activities': activities
        }, status=status.HTTP_200_OK)

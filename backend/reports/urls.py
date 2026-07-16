from django.urls import path
from .views import (
    ImportExcelView, ExportProjectsView, ExportEmployeesView,
    ExportTasksView, DashboardMetricsView
)

urlpatterns = [
    path('import/', ImportExcelView.as_view(), name='import_excel'),
    path('export/projects/', ExportProjectsView.as_view(), name='export_projects'),
    path('export/employees/', ExportEmployeesView.as_view(), name='export_employees'),
    path('export/tasks/', ExportTasksView.as_view(), name='export_tasks'),
    path('dashboard/', DashboardMetricsView.as_view(), name='dashboard_metrics'),
]

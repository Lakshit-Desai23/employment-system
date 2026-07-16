import pandas as pd
from django.db import transaction
from django.contrib.auth import get_user_model
from core.models import Department, Designation
from employees.models import EmployeeProfile
from projects.models import Project
from tasks.models import Task
from worklogs.models import DailyWorkLog
from datetime import datetime
import io

User = get_user_model()

class ExcelImportExportService:
    @staticmethod
    @transaction.atomic
    def import_projects(file_file):
        """Read projects sheet, validate, and upsert."""
        df = pd.read_excel(file_file)
        
        required_cols = ['name', 'code', 'start_date', 'end_date', 'budget', 'status']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        imported_count = 0
        updated_count = 0

        for _, row in df.iterrows():
            code = str(row['code']).strip()
            name = str(row['name']).strip()
            desc = str(row.get('description', '')).strip()
            
            # Parse dates safely
            start_date = pd.to_datetime(row['start_date']).date()
            end_date = pd.to_datetime(row['end_date']).date()
            budget = float(row['budget'])
            status = str(row['status']).strip().upper()

            # Normalize status value
            valid_statuses = [s[0] for s in Project.STATUS_CHOICES]
            if status not in valid_statuses:
                status = 'NOT_STARTED'

            project, created = Project.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'description': desc if desc else None,
                    'start_date': start_date,
                    'end_date': end_date,
                    'budget': budget,
                    'status': status
                }
            )

            if created:
                imported_count += 1
            else:
                updated_count += 1

        return imported_count, updated_count

    @staticmethod
    @transaction.atomic
    def import_employees(file_file):
        """Read employees sheet, validate, and upsert user accounts + profiles."""
        df = pd.read_excel(file_file)
        
        required_cols = ['email', 'first_name', 'last_name', 'role', 'phone', 'status']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        imported_count = 0
        updated_count = 0

        for _, row in df.iterrows():
            email = str(row['email']).strip().lower()
            first_name = str(row['first_name']).strip()
            last_name = str(row['last_name']).strip()
            role = str(row['role']).strip().upper()
            status = str(row['status']).strip().upper()
            phone = str(row['phone']).strip()
            address = str(row.get('address', '')).strip()
            skills = str(row.get('skills', '')).strip()
            dept_name = str(row.get('department', '')).strip()
            desig_name = str(row.get('designation', '')).strip()

            # Ensure Department & Designation exist
            department = None
            if dept_name and dept_name != 'nan':
                department, _ = Department.objects.get_or_create(name=dept_name)

            designation = None
            if desig_name and desig_name != 'nan':
                designation, _ = Designation.objects.get_or_create(name=desig_name)

            # Ensure valid role
            valid_roles = [r[0] for r in User.ROLE_CHOICES]
            if role not in valid_roles:
                role = 'EMPLOYEE'

            # Ensure valid status
            valid_statuses = [s[0] for s in EmployeeProfile.STATUS_CHOICES]
            if status not in valid_statuses:
                status = 'ACTIVE'

            # Upsert User
            user, user_created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': role
                }
            )

            if not user_created:
                user.first_name = first_name
                user.last_name = last_name
                user.role = role
                user.save()

            # Upsert Profile
            profile, profile_created = EmployeeProfile.objects.update_or_create(
                user=user,
                defaults={
                    'department': department,
                    'designation': designation,
                    'phone': phone if phone != 'nan' else None,
                    'address': address if address != 'nan' else None,
                    'skills': skills if skills != 'nan' else None,
                    'status': status
                }
            )

            if user_created or profile_created:
                imported_count += 1
            else:
                updated_count += 1

        return imported_count, updated_count

    @staticmethod
    @transaction.atomic
    def import_tasks(file_file):
        """Read tasks sheet, validate, and upsert."""
        df = pd.read_excel(file_file)

        required_cols = ['project_code', 'title', 'priority', 'status', 'est_hours']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        imported_count = 0
        updated_count = 0

        for _, row in df.iterrows():
            project_code = str(row['project_code']).strip()
            title = str(row['title']).strip()
            desc = str(row.get('description', '')).strip()
            priority = str(row['priority']).strip().upper()
            status = str(row['status']).strip().upper()
            est_hours = float(row['est_hours'])
            assigned_email = str(row.get('assigned_to_email', '')).strip().lower()

            # Find matching project
            try:
                project = Project.objects.get(code=project_code)
            except Project.DoesNotExist:
                continue  # Skip rows pointing to non-existent projects

            # Find assigned user
            assigned_to = None
            if assigned_email and assigned_email != 'nan':
                try:
                    assigned_to = User.objects.get(email=assigned_email)
                except User.DoesNotExist:
                    pass

            # Validate statuses
            valid_statuses = [s[0] for s in Task.STATUS_CHOICES]
            if status not in valid_statuses:
                status = 'TODO'

            valid_priorities = [p[0] for p in Task.PRIORITY_CHOICES]
            if priority not in valid_priorities:
                priority = 'MEDIUM'

            # Upsert task (match on project and title)
            task, created = Task.objects.update_or_create(
                project=project,
                title=title,
                defaults={
                    'description': desc if desc else None,
                    'priority': priority,
                    'status': status,
                    'est_hours': est_hours,
                    'assigned_to': assigned_to
                }
            )

            if created:
                imported_count += 1
            else:
                updated_count += 1

        return imported_count, updated_count

    @staticmethod
    def export_projects_to_excel():
        """Export projects to binary excel buffer."""
        projects = Project.objects.all()
        data = []
        for p in projects:
            data.append({
                'name': p.name,
                'code': p.code,
                'description': p.description or '',
                'start_date': p.start_date.strftime('%Y-%m-%d') if p.start_date else '',
                'end_date': p.end_date.strftime('%Y-%m-%d') if p.end_date else '',
                'budget': float(p.budget),
                'status': p.status,
                'created_by': p.created_by.email if p.created_by else ''
            })
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_employees_to_excel():
        """Export employees to binary excel buffer."""
        profiles = EmployeeProfile.objects.all().select_related('user', 'department', 'designation')
        data = []
        for ep in profiles:
            data.append({
                'email': ep.user.email,
                'first_name': ep.user.first_name,
                'last_name': ep.user.last_name,
                'role': ep.user.role,
                'department': ep.department.name if ep.department else '',
                'designation': ep.designation.name if ep.designation else '',
                'phone': ep.phone or '',
                'address': ep.address or '',
                'skills': ep.skills or '',
                'status': ep.status,
                'date_of_joining': ep.date_of_joining.strftime('%Y-%m-%d') if ep.date_of_joining else ''
            })
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_tasks_to_excel():
        """Export tasks to binary excel buffer."""
        tasks = Task.objects.all().select_related('project', 'assigned_to')
        data = []
        for t in tasks:
            data.append({
                'project_code': t.project.code,
                'project_name': t.project.name,
                'title': t.title,
                'description': t.description or '',
                'priority': t.priority,
                'status': t.status,
                'assigned_to_email': t.assigned_to.email if t.assigned_to else '',
                'assigned_to_name': t.assigned_to.full_name if t.assigned_to else '',
                'est_hours': float(t.est_hours),
                'act_hours': float(t.act_hours),
                'due_date': t.due_date.strftime('%Y-%m-%d') if t.due_date else '',
                'remarks': t.remarks or ''
            })
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        return buffer

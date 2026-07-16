import os
import django
import datetime
import pandas as pd
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'epm_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Department, Designation
from employees.models import EmployeeProfile
from projects.models import Project
from projects.services import ProjectService
from tasks.models import Task
from tasks.validators import validate_positive_hours
from worklogs.models import DailyWorkLog
from design_module.models import DesignTask, DesignRevision
from dev_module.models import DevTask, Bug

User = get_user_model()

def parse_date_safely(val):
    if pd.isna(val):
        return datetime.date.today()
    try:
        return pd.to_datetime(val).date()
    except Exception:
        return datetime.date.today()

def seed_from_excel():
    print("Seeding database using uploaded files...")

    # 1. Create Core Metadata
    eng_dept, _ = Department.objects.get_or_create(
        name="Engineering", 
        defaults={"description": "Software Development & DevOps"}
    )
    design_dept, _ = Department.objects.get_or_create(
        name="Creative Design", 
        defaults={"description": "UI/UX & Product Design"}
    )
    
    arch_desig, _ = Designation.objects.get_or_create(
        name="Lead Architect", 
        defaults={"description": "Systems Architect"}
    )
    ux_desig, _ = Designation.objects.get_or_create(
        name="UX Lead", 
        defaults={"description": "User Experience Designer"}
    )

    # 2. Create standard users/profiles for Dave (dev) and Diana (designer)
    dev_user, dev_created = User.objects.get_or_create(
        email="dev@epm.com",
        defaults={
            "first_name": "Dave",
            "last_name": "Developer",
            "role": "DEVELOPER"
        }
    )
    if dev_created:
        dev_user.set_password("password123")
        dev_user.save()

    designer_user, design_created = User.objects.get_or_create(
        email="designer@epm.com",
        defaults={
            "first_name": "Diana",
            "last_name": "Designer",
            "role": "DESIGNER"
        }
    )
    if design_created:
        designer_user.set_password("password123")
        designer_user.save()

    dev_profile, _ = EmployeeProfile.objects.get_or_create(
        user=dev_user,
        defaults={
            "department": eng_dept,
            "designation": arch_desig,
            "phone": "555-101",
            "skills": "Python, Django, React, Docker",
            "status": "ACTIVE",
            "date_of_joining": datetime.date(2025, 6, 1)
        }
    )

    designer_profile, _ = EmployeeProfile.objects.get_or_create(
        user=designer_user,
        defaults={
            "department": design_dept,
            "designation": ux_desig,
            "phone": "555-102",
            "skills": "Figma, Adobe XD, HTML/CSS",
            "status": "ACTIVE",
            "date_of_joining": datetime.date(2025, 8, 15)
        }
    )

    # 3. Create Target Project PRJ-001
    project, _ = Project.objects.get_or_create(
        code="PRJ-001",
        defaults={
            "name": "Demo Project - PRJ001",
            "description": "Initial target project seeded from requirements spreadsheet.",
            "start_date": datetime.date(2026, 1, 1),
            "end_date": datetime.date(2026, 12, 31),
            "budget": 100000.00,
            "status": "IN_PROGRESS",
            "created_by": dev_user
        }
    )
    ProjectService.assign_employee_to_project(project, dev_profile, "Developer")
    ProjectService.assign_employee_to_project(project, designer_profile, "Designer")

    # 4. Import Designing sheet -> Tasks + DesignTask
    design_file_path = r"C:\Users\laksh\Downloads\Demo Project - PRJ001.xlsx"
    if os.path.exists(design_file_path):
        print(f"Reading {design_file_path}...")
        df_design = pd.read_excel(design_file_path, sheet_name="Designing")
        for _, row in df_design.iterrows():
            feature = str(row['Module / Feature']).strip()
            screen = str(row['Screen']).strip()
            link = str(row['Link']).strip()
            revision = str(row['Revision']).strip()
            status_val = str(row['Status']).strip().upper()
            shared_date = parse_date_safely(row.get('Shared Date'))
            feedback = str(row.get('Client Feedback', 'ok')).strip()
            approved_date = parse_date_safely(row.get('Approved Date'))
            remarks = str(row.get('Remarks', 'No remarks')).strip()

            # Map status
            task_status = 'TODO'
            if 'APPROVED' in status_val:
                task_status = 'COMPLETED'
            elif 'RESUBMIT' in status_val or 'CHANGE' in status_val:
                task_status = 'IN_PROGRESS'

            title = f"{feature} - {screen}"
            task, _ = Task.objects.get_or_create(
                project=project,
                title=title[:200],
                defaults={
                    "assigned_to": designer_user,
                    "description": f"Design link: {link}",
                    "priority": "MEDIUM",
                    "status": task_status,
                    "est_hours": 8.00,
                    "act_hours": 8.00 if task_status == 'COMPLETED' else 0.00,
                    "due_date": approved_date,
                    "remarks": remarks if remarks != 'nan' else None,
                    "created_by": dev_user
                }
            )

            # Design Task Extension
            design_task, _ = DesignTask.objects.get_or_create(
                task=task,
                defaults={
                    "ui_screens_count": 1,
                    "status": "COMPLETED" if task_status == 'COMPLETED' else "WIREFRAME",
                    "client_feedback": feedback if feedback != 'nan' else None,
                    "approval_status": "APPROVED" if task_status == 'COMPLETED' else "PENDING",
                    "revision_count": int(revision.replace('V', '')) if 'V' in revision else 1
                }
            )
            
            # Record historical revision
            DesignRevision.objects.get_or_create(
                design_task=design_task,
                revision_number=design_task.revision_count,
                defaults={
                    "feedback": feedback if feedback != 'nan' else "Initial layout.",
                    "changes_made": "Layout created."
                }
            )

    # 5. Import Development sheet -> Tasks + DevTask
    if os.path.exists(design_file_path):
        df_dev = pd.read_excel(design_file_path, sheet_name="Development")
        for _, row in df_dev.iterrows():
            feature = str(row['Module / Feature']).strip()
            dev_task_name = str(row['Task']).strip()
            link = str(row['Link']).strip()
            revision = str(row['Revision']).strip()
            status_val = str(row['Status']).strip().upper()
            shared_date = parse_date_safely(row.get('Shared Date'))
            feedback = str(row.get('Client Feedback', 'ok')).strip()
            approved_date = parse_date_safely(row.get('Approved Date'))
            remarks = str(row.get('Remarks', 'No remarks')).strip()

            # Map status
            task_status = 'TODO'
            if 'SUBMIT' in status_val or 'APPROVED' in status_val:
                task_status = 'COMPLETED'
            elif 'CHANGE' in status_val:
                task_status = 'IN_PROGRESS'

            title = f"{feature} - {dev_task_name}"
            task, _ = Task.objects.get_or_create(
                project=project,
                title=title[:200],
                defaults={
                    "assigned_to": dev_user,
                    "description": f"Task URL: {link}",
                    "priority": "MEDIUM",
                    "status": task_status,
                    "est_hours": 12.00,
                    "act_hours": 12.00 if task_status == 'COMPLETED' else 0.00,
                    "due_date": approved_date,
                    "remarks": remarks if remarks != 'nan' else None,
                    "created_by": dev_user
                }
            )

            # Dev Task Extension
            DevTask.objects.get_or_create(
                task=task,
                defaults={
                    "dev_type": "API" if "API" in dev_task_name.upper() else "WEB",
                    "test_status": "PASSED" if task_status == 'COMPLETED' else "PENDING",
                    "bug_count": 0,
                    "deployment_status": "STAGING" if task_status == 'COMPLETED' else "LOCAL"
                }
            )

    # 6. Import Employee Work.xlsx -> DailyWorkLog
    work_file_path = r"C:\Users\laksh\Downloads\Employee Work.xlsx"
    if os.path.exists(work_file_path):
        print(f"Reading {work_file_path}...")
        
        # EMP-001 (Designer)
        df_emp1 = pd.read_excel(work_file_path, sheet_name="EMP-001")
        for _, row in df_emp1.iterrows():
            task_id = str(row['Task ID']).strip()
            task_type = str(row['Task Type']).strip()
            link = str(row['Link']).strip()
            status_val = str(row['Status']).strip()
            start_date = parse_date_safely(row.get('Start Date'))
            time_taken = row.get('Time Taken', 1.0)
            remarks = str(row.get('Remarks', '')).strip()

            # Autocalculate daily log hours
            hours = 8.0
            if not pd.isna(time_taken):
                hours = float(time_taken) * 8.0 if float(time_taken) <= 3 else float(time_taken)

            DailyWorkLog.objects.get_or_create(
                employee=designer_profile,
                date=start_date,
                notes=f"Task {task_id} ({task_type}). Link: {link}. Remarks: {remarks if remarks != 'nan' else 'None'}",
                defaults={
                    "start_time": datetime.time(9, 0),
                    "end_time": datetime.time(17, 0),
                    "total_hours": hours,
                    "blockers": "None"
                }
            )

        # EMP-002 (Developer)
        df_emp2 = pd.read_excel(work_file_path, sheet_name="EMP-002")
        for _, row in df_emp2.iterrows():
            task_id = str(row['Task ID']).strip()
            task_type = str(row['Task Type']).strip()
            link = str(row['Link']).strip()
            status_val = str(row['Status']).strip()
            start_date = parse_date_safely(row.get('Start Date'))
            time_taken = row.get('Time Taken', 1.0)
            remarks = str(row.get('Remarks', '')).strip()
            tl_remarks = str(row.get('Team Lead Remarks', '')).strip()

            hours = 8.0
            if not pd.isna(time_taken):
                hours = float(time_taken) * 8.0 if float(time_taken) <= 3 else float(time_taken)

            DailyWorkLog.objects.get_or_create(
                employee=dev_profile,
                date=start_date,
                notes=f"Task {task_id} ({task_type}). Link: {link}. Remarks: {remarks if remarks != 'nan' else ''}. TL: {tl_remarks if tl_remarks != 'nan' else ''}",
                defaults={
                    "start_time": datetime.time(9, 0),
                    "end_time": datetime.time(17, 0),
                    "total_hours": hours,
                    "blockers": "None"
                }
            )

    print("Actual spreadsheet seed completed successfully!")

if __name__ == '__main__':
    seed_from_excel()

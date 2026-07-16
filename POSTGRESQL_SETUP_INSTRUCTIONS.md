# EPM PostgreSQL Setup Instructions

This file is for local testing and production preparation of the EPM system with PostgreSQL.

## 1. Update backend/.env

Open:

```text
D:\lakshit\Technodha\epm\backend\.env
```

Set these values:

```env
DB_NAME=epm_db
DB_USER=postgres
DB_PASSWORD=your_real_postgres_password
DB_HOST=localhost
DB_PORT=5432
USE_SQLITE_FALLBACK=False
```

Important: `DB_PASSWORD` must be the real password of your local PostgreSQL user. If this password is wrong, Django will not start.

## 2. PostgreSQL psql Path

On this PC, psql was found here:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

You can run it directly with the full path:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432
```

## 3. Query: Create Database

Run this inside psql while connected to the default `postgres` database:

```sql
CREATE DATABASE epm_db;
```

If the database already exists, use this check first:

```sql
SELECT datname FROM pg_database WHERE datname = 'epm_db';
```

You can also use the project helper:

```powershell
cd D:\lakshit\Technodha\epm\backend
.\venv\Scripts\python.exe create_db.py
```

## 4. Run Django Migrations

After the database is created:

```powershell
cd D:\lakshit\Technodha\epm\backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py check
```

## 5. Query: Clear Database Data

Use this only when you want to clear testing data but keep all tables.

Connect to `epm_db` first:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432 -d epm_db
```

Then run:

```sql
TRUNCATE TABLE
  messaging_callsignal,
  messaging_message,
  messaging_callsession_participants,
  messaging_callsession,
  messaging_conversation_members,
  messaging_conversation,
  tasks_taskattachment,
  worklogs_worklog,
  dev_module_bug,
  dev_module_developmenttask,
  design_module_designtask,
  tasks_task,
  reports_report,
  notifications_notification,
  employees_employeeprofile,
  projects_project_assigned_employees,
  projects_project,
  authentication_user_groups,
  authentication_user_user_permissions,
  authentication_user
RESTART IDENTITY CASCADE;
```

Warning: this deletes all users, tasks, projects, messages, reports, and notifications.

## 6. Query: Create Admin User

Recommended way:

```powershell
cd D:\lakshit\Technodha\epm\backend
.\venv\Scripts\python.exe manage.py createsuperuser
```

Use these values for testing:

```text
Email: admin@epm.local
First name: Admin
Last name: User
Password: Admin@12345
```

SQL option for testing:

```sql
INSERT INTO authentication_user
  (password, last_login, is_superuser, email, first_name, last_name, role, is_temporary_password, is_active, is_staff, date_joined)
VALUES
  (
    'pbkdf2_sha256$1200000$OZ9EqYGelULaDkE8PXETzH$d0EaZiFICQIzb4Ut+3izI7Fhy8EwDlTldDO5AzUiyYk=',
    NULL,
    TRUE,
    'admin@epm.local',
    'Admin',
    'User',
    'ADMIN',
    FALSE,
    TRUE,
    TRUE,
    NOW()
  );
```

Login:

```text
Email: admin@epm.local
Password: Admin@12345
```

After login, change this password before using the software with real users.

## 7. Existing SQLite Data

Switching to PostgreSQL creates a new empty database. Existing data from:

```text
D:\lakshit\Technodha\epm\backend\db.sqlite3
```

will not move automatically.

If old local data is required, export and import with:

```powershell
cd D:\lakshit\Technodha\epm\backend
.\venv\Scripts\python.exe manage.py dumpdata --exclude auth.permission --exclude contenttypes > data.json
.\venv\Scripts\python.exe manage.py loaddata data.json
```

Only run import after PostgreSQL connection and migrations are working.

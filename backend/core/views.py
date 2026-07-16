from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
import json

from .models import Department, Designation, Company
from .serializers import DepartmentSerializer, DesignationSerializer, CompanySerializer
from authentication.permissions import IsAdminOrReadOnly, IsAdmin

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name']

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all().order_by('name')
    serializer_class = DesignationSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name']

class CompanyBrandingView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method in ['PUT', 'POST', 'PATCH']:
            return [IsAdmin()]
        return [AllowAny()]

    def _get_or_create_company(self):
        company = Company.objects.first()
        if not company:
            import os
            from django.conf import settings
            from django.core.files import File
            
            name = os.getenv('COMPANY_NAME', 'WorkOps Inc.')
            email = os.getenv('COMPANY_EMAIL', 'hello@workops.com')
            phone = os.getenv('COMPANY_PHONE', '+91 98765 43210')
            address = os.getenv('COMPANY_ADDRESS', 'Technodha Office, India')
            
            company = Company(
                name=name,
                email=email,
                phone=phone,
                address=address,
                primary_color=os.getenv('COMPANY_PRIMARY_COLOR', ''),
                secondary_color=os.getenv('COMPANY_SECONDARY_COLOR', ''),
                accent_color=os.getenv('COMPANY_ACCENT_COLOR', '')
            )
            
            # Check for logo in default folder
            logo_rel = os.getenv('COMPANY_LOGO_SOURCE', 'default_branding/logo.png')
            logo_abs = os.path.join(settings.BASE_DIR, logo_rel)
            if os.path.exists(logo_abs):
                try:
                    with open(logo_abs, 'rb') as f:
                        company.logo.save('logo.png', File(f), save=False)
                except Exception as e:
                    print(f"Error loading initial logo from {logo_abs}: {e}")
                    
            # Check for favicon in default folder
            favicon_rel = os.getenv('COMPANY_FAVICON_SOURCE', 'default_branding/favicon.ico')
            favicon_abs = os.path.join(settings.BASE_DIR, favicon_rel)
            if os.path.exists(favicon_abs):
                try:
                    with open(favicon_abs, 'rb') as f:
                        company.favicon.save('favicon.ico', File(f), save=False)
                except Exception as e:
                    print(f"Error loading initial favicon from {favicon_abs}: {e}")
            
            # Save the company object, which runs the save overrides and color analysis
            company.save()
            company.refresh_from_db()
        return company


    def get(self, request):
        company = self._get_or_create_company()
        serializer = CompanySerializer(company, context={'request': request})
        data = serializer.data
        data['theme_json'] = company.theme_json
        return Response(data)

    def put(self, request):
        company = self._get_or_create_company()
        
        data = {k: v for k, v in request.data.items()}
        if 'modules_config' in data and isinstance(data['modules_config'], str):
            try:
                data['modules_config'] = json.loads(data['modules_config'])
            except Exception:
                pass

        serializer = CompanySerializer(company, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            if request.data.get('clear_logo') == 'true':
                if company.logo:
                    company.logo.delete(save=False)
                company.logo = None
            if request.data.get('clear_favicon') == 'true':
                if company.favicon:
                    company.favicon.delete(save=False)
                company.favicon = None
                
            serializer.save()
            company.refresh_from_db()
            data = CompanySerializer(company, context={'request': request}).data
            data['theme_json'] = company.theme_json
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExportBrandingView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(
                name="WorkOps Inc.",
                primary_color="#1e40af",
                secondary_color="#0f766e",
                accent_color="#3b82f6"
            )
        export_data = {
            "name": company.name,
            "primary_color": company.primary_color,
            "secondary_color": company.secondary_color,
            "accent_color": company.accent_color,
            "theme_json": company.theme_json,
            "modules_config": company.modules_config,
        }
        response = HttpResponse(
            json.dumps(export_data, indent=2),
            content_type="application/json"
        )
        response['Content-Disposition'] = 'attachment; filename="epm-theme-settings.json"'
        return response

class ImportBrandingView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        try:
            if 'file' in request.FILES:
                import_file = request.FILES['file']
                data = json.loads(import_file.read().decode('utf-8'))
            else:
                data = request.data
                
            company = Company.objects.first()
            if not company:
                company = Company.objects.create()
                
            company.name = data.get('name', company.name)
            company.primary_color = data.get('primary_color', company.primary_color)
            company.secondary_color = data.get('secondary_color', company.secondary_color)
            company.accent_color = data.get('accent_color', company.accent_color)
            if 'modules_config' in data:
                company.modules_config = data['modules_config']
            
            if 'theme_json' in data:
                company.theme_json = data['theme_json']
                # Bypass the PIL color extraction model hooks so we preserve exactly what is imported
                super(Company, company).save()
            else:
                company.save()
                
            company.refresh_from_db()
            response_data = CompanySerializer(company, context={'request': request}).data
            response_data['theme_json'] = company.theme_json
            return Response(response_data)
        except Exception as e:
            return Response({"error": f"Failed to import theme: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


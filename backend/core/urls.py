from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, DesignationViewSet,
    CompanyBrandingView, ExportBrandingView, ImportBrandingView
)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('designations', DesignationViewSet, basename='designation')

urlpatterns = [
    path('branding/', CompanyBrandingView.as_view(), name='branding'),
    path('branding/export/', ExportBrandingView.as_view(), name='branding_export'),
    path('branding/import/', ImportBrandingView.as_view(), name='branding_import'),
    path('', include(router.urls)),
]


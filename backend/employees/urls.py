from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeProfileViewSet, WorkHistoryViewSet

router = DefaultRouter()
router.register('profiles', EmployeeProfileViewSet, basename='employee-profile')
router.register('work-histories', WorkHistoryViewSet, basename='work-history')

urlpatterns = [
    path('', include(router.urls)),
]

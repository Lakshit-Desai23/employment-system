from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DesignTaskViewSet, DesignRevisionViewSet

router = DefaultRouter()
router.register('design-tasks', DesignTaskViewSet, basename='design-task')
router.register('revisions', DesignRevisionViewSet, basename='design-revision')

urlpatterns = [
    path('', include(router.urls)),
]

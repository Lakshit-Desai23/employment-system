from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DevTaskViewSet, BugViewSet

router = DefaultRouter()
router.register('dev-tasks', DevTaskViewSet, basename='dev-task')
router.register('bugs', BugViewSet, basename='dev-bug')

# Routing patterns
urlpatterns = [
    path('', include(router.urls)),
]

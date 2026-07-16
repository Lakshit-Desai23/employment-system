from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskAttachmentViewSet

router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='task')
router.register('attachments', TaskAttachmentViewSet, basename='task-attachment')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, CallSessionViewSet, MemberDirectoryViewSet, PresenceStatusViewSet

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('messages', MessageViewSet, basename='message')
router.register('calls', CallSessionViewSet, basename='call')
router.register('members', MemberDirectoryViewSet, basename='message-member')
router.register('presence', PresenceStatusViewSet, basename='presence')

urlpatterns = [
    path('', include(router.urls)),
]

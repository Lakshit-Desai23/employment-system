from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'title', 'is_read', 'type', 'created_at')
    list_filter = ('is_read', 'type')
    search_fields = ('recipient__email', 'title', 'message')

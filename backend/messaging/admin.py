from django.contrib import admin
from .models import Conversation, ConversationMember, Message, CallSession, CallSignal


class ConversationMemberInline(admin.TabularInline):
    model = ConversationMember
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'conversation_type', 'created_by', 'created_at')
    list_filter = ('conversation_type', 'created_at')
    search_fields = ('title', 'created_by__email')
    inlines = (ConversationMemberInline,)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'message_type', 'created_at')
    list_filter = ('message_type', 'created_at')
    search_fields = ('body', 'sender__email')


@admin.register(CallSession)
class CallSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'initiated_by', 'call_type', 'status', 'started_at', 'ended_at')
    list_filter = ('call_type', 'status', 'started_at')


@admin.register(CallSignal)
class CallSignalAdmin(admin.ModelAdmin):
    list_display = ('id', 'call', 'sender', 'signal_type', 'created_at')
    list_filter = ('signal_type', 'created_at')

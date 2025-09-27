from django.contrib import admin

from .models import AuctionItem, Notification

@admin.register(AuctionItem)
class AuctionItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'starting_bid', 'current_bid', 'status', 'created_at', 'updated_at')
    search_fields = ('title', 'description', 'owner__username')
    list_filter = ('status', 'created_at', 'updated_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')
    readonly_fields = ('created_at',)

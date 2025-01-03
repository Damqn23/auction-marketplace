from django.contrib import admin

from .models import AuctionItem

@admin.register(AuctionItem)
class AuctionItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'starting_bid', 'current_bid', 'status', 'created_at', 'updated_at')
    search_fields = ('title', 'description', 'owner__username')
    list_filter = ('status', 'created_at', 'updated_at')

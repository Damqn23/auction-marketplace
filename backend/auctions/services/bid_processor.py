# auctions/services/bid_processor.py
"""
Bid Processing Service
Handles the actual bid processing, refunds, and anti-snipe logic.
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction


class BidProcessor:
    """Service class for processing bids and related operations."""
    
    ANTI_SNIPE_THRESHOLD_SECONDS = 120  # 2 minutes
    EXTENSION_DURATION_SECONDS = 120    # Extend by 2 minutes
    
    @staticmethod
    def handle_outbid_refund(old_bid, auction_item, current_user):
        """
        Refund the previous highest bidder if they're being outbid.
        
        Args:
            old_bid: The previous highest Bid instance
            auction_item: The AuctionItem instance
            current_user: The User placing the new bid
            
        Returns:
            tuple: (old_bidder, old_amount) or (None, None) if no refund needed
        """
        if not old_bid or old_bid.bidder == current_user:
            return None, None
        
        from ..models import UserAccount
        
        old_bidder = old_bid.bidder
        old_amount = old_bid.amount
        
        # Refund the old bidder
        old_account = UserAccount.objects.select_for_update().get(user=old_bidder)
        old_account.balance += old_amount
        old_account.save()
        
        return old_bidder, old_amount
    
    @staticmethod
    def process_new_bid(auction_item, user, amount, bidder_account):
        """
        Process a new bid from a user who hasn't bid before or is not the current highest.
        
        Args:
            auction_item: The AuctionItem instance
            user: The User placing the bid
            amount: The bid amount as Decimal
            bidder_account: The UserAccount instance (already locked)
            
        Returns:
            Bid: The newly created Bid instance
        """
        from ..models import Bid
        
        # Deduct funds from bidder
        bidder_account.balance -= amount
        bidder_account.save()
        
        # Create new bid
        new_bid = Bid.objects.create(
            auction_item=auction_item,
            bidder=user,
            amount=amount
        )
        
        # Update auction item current bid
        auction_item.current_bid = amount
        auction_item.save()
        
        return new_bid
    
    @staticmethod
    def process_rebid(auction_item, user, amount, bidder_account, old_bid):
        """
        Process a rebid from the current highest bidder increasing their bid.
        
        Args:
            auction_item: The AuctionItem instance
            user: The User placing the bid
            amount: The new bid amount as Decimal
            bidder_account: The UserAccount instance (already locked)
            old_bid: The user's previous highest Bid instance
            
        Returns:
            Bid: The newly created Bid instance
        """
        from ..models import Bid
        
        difference = amount - old_bid.amount
        
        # Deduct only the difference
        bidder_account.balance -= difference
        bidder_account.save()
        
        # Create new bid
        new_bid = Bid.objects.create(
            auction_item=auction_item,
            bidder=user,
            amount=amount
        )
        
        # Update auction item current bid
        auction_item.current_bid = amount
        auction_item.save()
        
        return new_bid
    
    @staticmethod
    def handle_anti_snipe_extension(auction_item):
        """
        Extend auction end time if bid is placed close to the end (anti-sniping).
        
        Args:
            auction_item: The AuctionItem instance
            
        Returns:
            bool: True if the auction was extended, False otherwise
        """
        now = timezone.now()
        time_left = auction_item.end_time - now
        
        if time_left.total_seconds() < BidProcessor.ANTI_SNIPE_THRESHOLD_SECONDS:
            # Calculate new end time
            new_end = now + timedelta(seconds=BidProcessor.EXTENSION_DURATION_SECONDS)
            
            # Only extend if the new time is later than current end time
            if new_end > auction_item.end_time:
                auction_item.end_time = new_end
                auction_item.save()
                return True
        
        return False
    
    @staticmethod
    def notify_balance_update(user_id, new_balance):
        """
        Send WebSocket notification about balance update.
        
        Args:
            user_id: The user's ID
            new_balance: The new balance as Decimal
        """
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_balance_{user_id}",
                {
                    "type": "balance_update",
                    "balance": str(new_balance)
                }
            )
    
    @staticmethod
    def get_highest_bid(auction_item):
        """
        Get the current highest bid for an auction.
        
        Args:
            auction_item: The AuctionItem instance
            
        Returns:
            Bid or None: The highest bid or None if no bids exist
        """
        return auction_item.bids.order_by("-amount").first()

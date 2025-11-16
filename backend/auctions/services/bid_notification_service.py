# auctions/services/bid_notification_service.py
"""
Bid Notification Service
Handles creating and sending notifications related to bidding activities.
"""


class BidNotificationService:
    """Service class for handling bid-related notifications."""
    
    @staticmethod
    def notify_outbid(old_bidder, auction_item, new_amount):
        """
        Notify a user that they have been outbid.
        
        Args:
            old_bidder: The User who was outbid
            auction_item: The AuctionItem instance
            new_amount: The new bid amount
        """
        from ..models import Notification
        
        Notification.objects.create(
            user=old_bidder,
            notification_type="outbid",
            title=f"You have been outbid on \"{auction_item.title}\"",
            message=f"Someone placed a higher bid of ${new_amount}. Current bid is now ${new_amount}.",
            auction_item=auction_item,
        )
    
    @staticmethod
    def notify_owner_new_bid(owner, auction_item, bidder_username, amount):
        """
        Notify the auction owner of a new bid.
        
        Args:
            owner: The User who owns the auction
            auction_item: The AuctionItem instance
            bidder_username: Username of the bidder
            amount: The bid amount
        """
        from ..models import Notification
        
        if owner == auction_item.owner:  # Extra safety check
            Notification.objects.create(
                user=owner,
                notification_type="bid",
                title=f"New bid placed on \"{auction_item.title}\"",
                message=f"{bidder_username} placed a bid of ${amount} on your auction.",
                auction_item=auction_item,
            )
    
    @staticmethod
    def notify_owner_bid_increased(owner, auction_item, bidder_username, amount):
        """
        Notify the auction owner that an existing bidder increased their bid.
        
        Args:
            owner: The User who owns the auction
            auction_item: The AuctionItem instance
            bidder_username: Username of the bidder
            amount: The new bid amount
        """
        from ..models import Notification
        
        if owner == auction_item.owner:  # Extra safety check
            Notification.objects.create(
                user=owner,
                notification_type="bid",
                title=f"Bid increased on \"{auction_item.title}\"",
                message=f"{bidder_username} increased their bid to ${amount} on your auction.",
                auction_item=auction_item,
            )
    
    @staticmethod
    def notify_auction_extended(auction_item, new_end_time):
        """
        Notify all bidders that the auction has been extended (anti-snipe).
        
        Args:
            auction_item: The AuctionItem instance
            new_end_time: The new end time as datetime
        """
        from ..models import Notification
        
        # Get all unique bidders for this auction
        bidders = auction_item.bids.values_list('bidder', flat=True).distinct()
        
        for bidder_id in bidders:
            from django.contrib.auth.models import User
            try:
                bidder = User.objects.get(id=bidder_id)
                Notification.objects.create(
                    user=bidder,
                    notification_type="bid",
                    title=f"Auction extended: \"{auction_item.title}\"",
                    message=f"The auction has been extended due to late bidding. New end time: {new_end_time.strftime('%Y-%m-%d %H:%M')}",
                    auction_item=auction_item,
                )
            except User.DoesNotExist:
                continue

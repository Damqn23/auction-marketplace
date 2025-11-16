# auctions/services/bid_validator.py
"""
Bid Validation Service
Handles all bid validation logic in a centralized location.
"""

from decimal import Decimal, InvalidOperation
from django.utils import timezone
from rest_framework.response import Response


class BidValidator:
    """Service class for validating bids before processing."""
    
    MIN_BID_INCREMENT_PERCENTAGE = Decimal("0.02")  # 2%
    
    @staticmethod
    def validate_bid_eligibility(auction_item, user):
        """
        Validate if a user can bid on an auction item.
        
        Args:
            auction_item: The AuctionItem instance
            user: The User instance attempting to bid
            
        Returns:
            tuple: (is_valid, error_response)
                   If valid: (True, None)
                   If invalid: (False, Response object with error)
        """
        # Check if auction has ended
        now = timezone.now()
        if auction_item.end_time <= now:
            from ..models import Bid
            highest_bid = auction_item.bids.order_by("-amount").first()
            if highest_bid:
                auction_item.winner = highest_bid.bidder
            auction_item.status = "closed"
            auction_item.save()
            return False, Response({"detail": "Bidding is closed for this item."}, status=400)
        
        # Check auction status
        if auction_item.status != "active":
            return False, Response({"detail": "Bidding is closed for this item."}, status=400)
        
        # Check ownership
        if auction_item.owner == user:
            return False, Response({"detail": "Owners cannot bid on their own items."}, status=403)
        
        # Check if already purchased via Buy Now
        if auction_item.buy_now_buyer is not None:
            return False, Response({"detail": "This item has been purchased via Buy Now."}, status=400)
        
        return True, None
    
    @staticmethod
    def validate_bid_amount(amount_str, auction_item):
        """
        Validate the bid amount.
        
        Args:
            amount_str: The bid amount as a string
            auction_item: The AuctionItem instance
            
        Returns:
            tuple: (is_valid, amount_decimal, error_response)
                   If valid: (True, Decimal(amount), None)
                   If invalid: (False, None, Response object with error)
        """
        if not amount_str:
            return False, None, Response({"detail": "Bid amount is required."}, status=400)
        
        # Parse amount
        try:
            amount = Decimal(str(amount_str))
        except (ValueError, InvalidOperation):
            return False, None, Response({"detail": "Invalid bid amount."}, status=400)
        
        # Calculate minimum required bid
        min_bid = auction_item.current_bid or auction_item.starting_bid
        min_increment = (min_bid * BidValidator.MIN_BID_INCREMENT_PERCENTAGE).quantize(Decimal("0.01"))
        min_required_bid = (min_bid + min_increment).quantize(Decimal("0.01"))
        
        # Check against Buy Now price
        if auction_item.buy_now_price and amount >= auction_item.buy_now_price:
            return False, None, Response(
                {"detail": f"Bid must be less than Buy Now price of ${auction_item.buy_now_price}."},
                status=400
            )
        
        # Check minimum bid requirement
        if amount < min_required_bid:
            return False, None, Response(
                {"detail": f"Bid must be at least ${min_required_bid}."},
                status=400
            )
        
        return True, amount, None
    
    @staticmethod
    def validate_user_balance(user, amount, is_rebid=False, current_bid_amount=None):
        """
        Validate if user has sufficient balance.
        
        Args:
            user: The User instance
            amount: The bid amount as Decimal
            is_rebid: Boolean indicating if this is a re-bid from same user
            current_bid_amount: Current bid amount if re-bidding
            
        Returns:
            tuple: (is_valid, bidder_account, error_response)
        """
        from ..models import UserAccount
        
        bidder_account = UserAccount.objects.select_for_update().get(user=user)
        
        if is_rebid:
            difference = amount - current_bid_amount
            if difference <= 0:
                return False, None, Response(
                    {"detail": "New bid must be higher than your current highest bid."},
                    status=400
                )
            
            if bidder_account.balance < difference:
                return False, None, Response({"detail": "Insufficient funds."}, status=400)
        else:
            if bidder_account.balance < amount:
                return False, None, Response({"detail": "Insufficient funds."}, status=400)
        
        return True, bidder_account, None
    
    @staticmethod
    def validate_bid_rate_limit(auction_item, user):
        """
        Check if user is attempting to bid too quickly (rate limiting).
        
        Args:
            auction_item: The AuctionItem instance
            user: The User instance
            
        Returns:
            tuple: (is_valid, error_response)
        """
        from ..models import Bid
        
        now = timezone.now()
        last_bid = Bid.objects.filter(
            auction_item=auction_item,
            bidder=user
        ).order_by("-timestamp").first()
        
        if last_bid and (now - last_bid.timestamp).total_seconds() < 30:
            remaining = 30 - int((now - last_bid.timestamp).total_seconds())
            return False, Response(
                {"detail": f"You must wait {remaining} more seconds before bidding again."},
                status=400
            )
        
        return True, None

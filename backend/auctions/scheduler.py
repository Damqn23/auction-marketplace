"""
Auction closing scheduler using APScheduler.
Runs a periodic job to check and close expired auctions.
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


def close_expired_auctions():
    """
    Close all auctions that have passed their end_time.
    - Resolve winner (highest bidder)
    - Update auction status to 'closed'
    - Release funds for losing bidders
    - Create notifications for winner and owner
    - Broadcast balance updates
    """
    from auctions.models import AuctionItem, Bid, UserAccount, Notification, Transaction

    now = timezone.now()
    expired_auctions = AuctionItem.objects.filter(
        status="active", end_time__lte=now
    ).select_related("owner")

    if not expired_auctions.exists():
        logger.debug("No expired auctions to close.")
        return

    channel_layer = get_channel_layer()

    for auction in expired_auctions:
        with transaction.atomic():
            # Lock the auction row
            auction = AuctionItem.objects.select_for_update().get(pk=auction.pk)

            # Double-check it's still active (another process might have closed it)
            if auction.status != "active":
                continue

            # Get the highest bid
            highest_bid = (
                Bid.objects.filter(auction_item=auction).order_by("-amount").first()
            )

            if highest_bid:
                winner = highest_bid.bidder
                winning_amount = highest_bid.amount

                # Set the winner
                auction.winner = winner
                auction.status = "closed"
                auction.save()

                # Release funds for all OTHER bidders
                losing_bids = Bid.objects.filter(auction_item=auction).exclude(
                    bidder=winner
                )
                for bid in losing_bids:
                    bidder_account = UserAccount.objects.select_for_update().get(
                        user=bid.bidder
                    )
                    bidder_account.balance += bid.amount
                    bidder_account.save()

                    # Create transaction record
                    Transaction.objects.create(
                        user=bid.bidder,
                        transaction_type="bid_release",
                        amount=bid.amount,
                        status="completed",
                        description=f"Bid refund for '{auction.title}'",
                    )

                    # Notify losing bidder
                    Notification.objects.create(
                        user=bid.bidder,
                        notification_type="ended",
                        title="Auction Ended",
                        message=f"The auction for '{auction.title}' has ended. You did not win.",
                        auction_item=auction,
                    )

                # Notify winner
                Notification.objects.create(
                    user=winner,
                    notification_type="won",
                    title="Congratulations!",
                    message=f"You won the auction for '{auction.title}' with a bid of ${winning_amount}.",
                    auction_item=auction,
                )

                # Notify owner
                Notification.objects.create(
                    user=auction.owner,
                    notification_type="ended",
                    title="Auction Ended",
                    message=f"Your auction for '{auction.title}' has ended. Winner: {winner.username} with ${winning_amount}.",
                    auction_item=auction,
                )

                logger.info(
                    f"Closed auction '{auction.title}' (ID {auction.pk}). Winner: {winner.username} with ${winning_amount}."
                )

            else:
                # No bids, just close the auction
                auction.status = "closed"
                auction.save()

                # Notify owner
                Notification.objects.create(
                    user=auction.owner,
                    notification_type="ended",
                    title="Auction Ended",
                    message=f"Your auction for '{auction.title}' has ended with no bids.",
                    auction_item=auction,
                )

                logger.info(
                    f"Closed auction '{auction.title}' (ID {auction.pk}) with no bids."
                )

        # Broadcast balance updates outside the transaction (post-commit)
        if highest_bid:
            # Notify all losing bidders of balance update
            losing_bids = Bid.objects.filter(auction_item=auction).exclude(
                bidder=auction.winner
            )
            for bid in losing_bids:
                bidder_account = UserAccount.objects.get(user=bid.bidder)
                group_name = f"user_balance_{bid.bidder.id}"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {"type": "balance_update", "balance": float(bidder_account.balance)},
                )


# Global scheduler instance
scheduler = None


def start_scheduler():
    """
    Start the APScheduler background scheduler.
    Runs close_expired_auctions every 60 seconds.
    """
    global scheduler
    if scheduler is not None:
        logger.warning("Scheduler already running.")
        return

    scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))
    scheduler.add_job(
        close_expired_auctions,
        trigger=IntervalTrigger(seconds=60),
        id="close_expired_auctions",
        name="Close expired auctions",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Auction closing scheduler started. Checking every 60 seconds.")


def stop_scheduler():
    """
    Stop the scheduler gracefully.
    """
    global scheduler
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Auction closing scheduler stopped.")

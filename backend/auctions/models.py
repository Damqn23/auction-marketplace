# auctions/models.py

from django.db import models
from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class UserAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account")
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def __str__(self):
        return f"{self.user.username} account - balance: ${self.balance}"


@receiver(post_save, sender=User)
def create_user_account(sender, instance, created, **kwargs):
    if created:
        UserAccount.objects.create(user=instance)


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ("deposit", "Deposit"),
        ("withdrawal", "Withdrawal"),
        ("bid_lock", "Bid Lock"),  # When funds are temporarily held for a bid.
        ("bid_release", "Bid Release"),  # When funds are released (e.g., bid lost).
        ("seller_payment", "Seller Payment"),  # Payment to seller after verification.
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="transactions"
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} of {self.amount} for {self.user.username} - {self.status}"


class AuctionItem(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("closed", "Closed"),
        ("cancelled", "Cancelled"),
    ]

    SHIPPING_STATUS_CHOICES = [
        ("not_shipped", "Not Shipped"),
        ("shipped", "Shipped"),
        ("received", "Received"),
    ]

    shipping_status = models.CharField(
        max_length=20, choices=SHIPPING_STATUS_CHOICES, default="not_shipped"
    )
    verified = models.BooleanField(default=False)
    title = models.CharField(max_length=100)
    description = models.TextField()
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2)
    current_bid = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    image = models.ImageField(upload_to="auction_images/", null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(
        User, related_name="auction_items", on_delete=models.CASCADE
    )
    end_time = models.DateTimeField()  # New field for auction end time
    buy_now_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )  # New field
    buy_now_buyer = models.ForeignKey(
        User,
        related_name="buy_now_purchases",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )  # To track buyer
    winner = models.ForeignKey(
        User,
        related_name="won_auctions",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )  # New Field
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="products"
    )
    condition = models.CharField(
        max_length=50,
        choices=[("New", "New"), ("Used", "Used"), ("Refurbished", "Refurbished")],
    )
    location = models.CharField(max_length=100)

    class Meta:
        indexes = [
            models.Index(fields=["status", "end_time"]),
            models.Index(fields=["owner"]),
            models.Index(fields=["winner"]),
        ]

    @property
    def effective_status(self):
        if self.status == "active" and self.end_time <= timezone.now():
            return "closed"
        return self.status

    def clean(self):
        if self.end_time <= timezone.now():
            raise ValidationError("End time must be in the future.")

    def __str__(self):
        return self.title


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    auction_item = models.ForeignKey(
        AuctionItem, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "auction_item")

    def __str__(self):
        return f"{self.user.username} favorited {self.auction_item.title}"


class Bid(models.Model):
    auction_item = models.ForeignKey(
        AuctionItem, related_name="bids", on_delete=models.CASCADE
    )
    bidder = models.ForeignKey(User, related_name="bids", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-amount", "timestamp"]
        unique_together = ("auction_item", "bidder", "amount")
        indexes = [
            models.Index(fields=["auction_item", "amount"]),
            models.Index(fields=["bidder"]),
        ]

    def __str__(self):
        return f"{self.bidder.username} bid ${self.amount} on {self.auction_item.title}"


class AuctionImage(models.Model):
    auction_item = models.ForeignKey(
        AuctionItem, related_name="images", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="auction_images/")

    def __str__(self):
        return f"Image for {self.auction_item.title}"


class ChatMessage(models.Model):
    sender = models.ForeignKey(
        User, related_name="sent_messages", on_delete=models.CASCADE
    )
    recipient = models.ForeignKey(
        User, related_name="received_messages", on_delete=models.CASCADE
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # To track if the message is read

    class Meta:
        indexes = [
            models.Index(fields=["sender", "recipient", "timestamp"]),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username} at {self.timestamp}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("bid", "New Bid"),
        ("outbid", "Outbid"),
        ("won", "Auction Won"),
        ("ending_soon", "Auction Ending Soon"),
        ("ended", "Auction Ended"),
        ("buy_now", "Buy Now Purchase"),
        ("shipped", "Item Shipped"),
    ]

    user = models.ForeignKey(User, related_name="notifications", on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    auction_item = models.ForeignKey(
        AuctionItem, related_name="notifications", on_delete=models.CASCADE, null=True, blank=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "created_at"]),
        ]

    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.user.username}: {self.title}"

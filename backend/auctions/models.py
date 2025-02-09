# auctions/models.py
from enum import unique

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError


class Category(models.Model):
    name = models.CharField(max_length = 100, unique = True)

    def __str__(self):
        return self.name

class AuctionItem(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2)
    current_bid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to='auction_images/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, related_name='auction_items', on_delete=models.CASCADE)
    end_time = models.DateTimeField()  # New field for auction end time
    buy_now_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # New field
    buy_now_buyer = models.ForeignKey(User, related_name='buy_now_purchases', on_delete=models.SET_NULL, null=True, blank=True)  # To track buyer
    winner = models.ForeignKey(User, related_name='won_auctions', on_delete=models.SET_NULL, null=True, blank=True)  # New Field
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    condition = models.CharField(
        max_length=50,
        choices=[('New', 'New'), ('Used', 'Used'), ('Refurbished', 'Refurbished')]
    )
    location = models.CharField(max_length=100)


    def clean(self):
        if self.end_time <= timezone.now():
            raise ValidationError("End time must be in the future.")


    def __str__(self):
        return self.title


class Bid(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='bids', on_delete=models.CASCADE)
    bidder = models.ForeignKey(User, related_name='bids', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-amount', 'timestamp']
        unique_together = ('auction_item', 'bidder', 'amount')

    def __str__(self):
        return f"{self.bidder.username} bid ${self.amount} on {self.auction_item.title}"


class AuctionImage(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='auction_images/')

    def __str__(self):
        return f"Image for {self.auction_item.title}"

class ChatMessage(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # To track if the message is read

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username} at {self.timestamp}"


"""
Django management command to manually close expired auctions.
Usage: python manage.py close_auctions
"""
from django.core.management.base import BaseCommand
from auctions.scheduler import close_expired_auctions


class Command(BaseCommand):
    help = "Manually close all expired auctions and resolve winners"

    def handle(self, *args, **options):
        self.stdout.write("Checking for expired auctions...")
        close_expired_auctions()
        self.stdout.write(self.style.SUCCESS("Auction closing task completed."))

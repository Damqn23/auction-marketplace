# auctions/views/payments.py

from decimal import Decimal
import logging

from django.conf import settings
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

import stripe
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import Transaction

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateDepositPaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        amount_str = request.data.get("amount")
        if not amount_str:
            return Response({"detail": "Deposit amount is required."}, status=400)
        try:
            amount = Decimal(amount_str)
        except Exception:
            return Response({"detail": "Invalid amount format."}, status=400)
        if amount <= 0:
            return Response({"detail": "Deposit amount must be positive."}, status=400)

        amount_cents = int(amount * 100)
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                metadata={"user_id": request.user.id, "deposit_amount": str(amount)},
            )
        except Exception as e:
            logger.error(f"Stripe PaymentIntent creation failed: {e}")
            return Response({"detail": "Error creating PaymentIntent."}, status=500)

        return Response({"client_secret": intent.client_secret}, status=200)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    permission_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            metadata = payment_intent.get("metadata", {})
            user_id = metadata.get("user_id")
            deposit_amount_str = metadata.get("deposit_amount")

            if user_id and deposit_amount_str:
                try:
                    deposit_amount = Decimal(deposit_amount_str)
                    user = User.objects.get(id=user_id)
                    with transaction.atomic():
                        user.account.balance += deposit_amount
                        user.account.save()
                        Transaction.objects.create(
                            user=user,
                            transaction_type="deposit",
                            amount=deposit_amount,
                            status="completed",
                            description="Deposit completed via Stripe.",
                        )
                except Exception as e:
                    logger.error(f"Error handling payment_intent.succeeded: {e}")
                    return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif event["type"] == "payment_intent.payment_failed":
            pass

        return Response(status=status.HTTP_200_OK)

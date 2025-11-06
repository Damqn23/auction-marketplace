import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import ChatMessage  # <-- Import your ChatMessage model


class ChatConsumer(AsyncWebsocketConsumer):
    RATE_LIMITS = {
        "chat_message": {"count": 5, "window": 5},  # 5 messages per 5 seconds
        "typing": {"count": 10, "window": 5},       # 10 typing events per 5 seconds
    }

    async def _rate_limited(self, event_type: str) -> bool:
        """Return True if the sender is over the rate limit for this room/event."""
        limits = self.RATE_LIMITS.get(event_type)
        if not limits:
            return False
        key = f"chatrl:{self.room_name}:{self.username}:{event_type}"

        # Use sync cache ops via sync_to_async to avoid blocking
        current = await sync_to_async(cache.get)(key)
        if current is None:
            # Initialize counter with TTL = window
            await sync_to_async(cache.set)(key, 1, timeout=limits["window"])
            return False
        if int(current) >= limits["count"]:
            return True
        # Increment, preserving TTL (re-set with same timeout)
        # Not perfectly atomic on all backends, but sufficient with Redis
        await sync_to_async(cache.set)(key, int(current) + 1, timeout=limits["window"])
        return False
    async def connect(self):
        # Check if user is authenticated
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        # Extract and validate room_name from the URL (expected format: "userA_userB")
        self.room_name = self.scope["url_route"]["kwargs"].get("room_name", "")
        parts = self.room_name.split("_")
        if len(parts) != 2:
            await self.close()
            return

        self.username = self.scope["user"].username
        self.participants = set(parts)
        if self.username not in self.participants:
            # User is not part of this room
            await self.close()
            return

        # Compute the other participant
        self.other_username = next(iter(self.participants - {self.username}))

        self.room_group_name = f"chat_{self.room_name}"

        # Join the group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type", "chat_message")

        if msg_type == "chat_message":
            if await self._rate_limited("chat_message"):
                return  # drop silently
            message = (data.get("message") or "").strip()
            if not message:
                return

            # Enforce server-side identity and recipient
            sender_username = self.username
            recipient_username = data.get("recipient") or self.other_username
            if recipient_username != self.other_username:
                # Prevent sending to users outside this room
                return

            try:
                sender_user = await sync_to_async(User.objects.get)(username=sender_username)
                recipient_user = await sync_to_async(User.objects.get)(username=recipient_username)
            except User.DoesNotExist:
                return

            # Persist the message
            await sync_to_async(ChatMessage.objects.create)(
                sender=sender_user, recipient=recipient_user, message=message
            )

            # Broadcast to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message_event",
                    "message": message,
                    "sender": sender_username,
                },
            )

        elif msg_type == "typing":
            if await self._rate_limited("typing"):
                return
            # Broadcast typing event from authenticated user only
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_event",
                    "sender": self.username,
                },
            )
        else:
            # Unknown type
            return

    async def chat_message_event(self, event):
        # Called when the group sends a "chat_message_event"
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                    "sender": event["sender"],
                }
            )
        )

    async def typing_event(self, event):
        # Called when the group sends a "typing_event"
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "sender": event["sender"],
                }
            )
        )


class BalanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Only allow authenticated users to connect
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            self.user = self.scope["user"]
            # Create a unique group name for each user
            self.group_name = f"user_balance_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # This handler receives the balance update event
    async def balance_update(self, event):
        balance = event["balance"]
        await self.send(text_data=json.dumps({"balance": balance}))

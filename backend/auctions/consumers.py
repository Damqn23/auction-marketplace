import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from .models import ChatMessage  # <-- Import your ChatMessage model


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract the room_name from the URL
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
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
            message = data.get("message")
            sender = data.get("sender")
            recipient = data.get("recipient")

            # Only save to DB if we have a real message
            if message and sender and recipient:
                sender_user = await sync_to_async(User.objects.get)(username=sender)
                recipient_user = await sync_to_async(User.objects.get)(
                    username=recipient
                )
                await sync_to_async(ChatMessage.objects.create)(
                    sender=sender_user, recipient=recipient_user, message=message
                )

            # Broadcast to group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message_event",
                    "message": message,
                    "sender": sender,
                },
            )

        elif msg_type == "typing":
            # The user is typing
            sender = data.get("sender")
            # Broadcast a "typing" event to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_event",
                    "sender": sender,
                },
            )
        else:
            # Unknown type
            pass

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

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from .models import ChatMessage  # <-- Import your ChatMessage model


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract room name from the URL route.
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join the group corresponding to the room.
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group when the socket disconnects.
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Called when a message is received from the WebSocket.
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        sender = data.get("sender")
        recipient = data.get("recipient")  # We'll pass this from the frontend

        # 1) Save to DB if both sender & recipient exist
        if sender and recipient:
            sender_user = await sync_to_async(User.objects.get)(username=sender)
            recipient_user = await sync_to_async(User.objects.get)(username=recipient)
            await sync_to_async(ChatMessage.objects.create)(
                sender=sender_user, recipient=recipient_user, message=message
            )

        # 2) Broadcast the message to the room group so everyone in it sees the new message.
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": sender,
            },
        )

    # Called when a message is sent to the group.
    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]

        # Send the message to the WebSocket.
        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "sender": sender,
                }
            )
        )

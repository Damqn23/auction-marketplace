# auctions/views/chat.py

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import ChatMessage
from ..serializers import ChatMessageSerializer


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        unread_messages = ChatMessage.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"unread_count": unread_messages})

    @action(detail=False, methods=["get"])
    def get_messages(self, request):
        user = request.user
        other_username = request.query_params.get("other_username")

        if other_username:
            try:
                other_user = User.objects.get(username=other_username)
            except User.DoesNotExist:
                return Response({"detail": "Recipient does not exist."}, status=status.HTTP_404_NOT_FOUND)

            messages = ChatMessage.objects.filter(
                Q(sender=user, recipient=other_user) | Q(sender=other_user, recipient=user)
            ).order_by("timestamp")
        else:
            messages = ChatMessage.objects.filter(Q(sender=user) | Q(recipient=user)).order_by("-timestamp")

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def send_message(self, request):
        sender = request.user
        recipient_username = request.data.get("recipient_username")
        message = request.data.get("message")

        if not recipient_username or not message:
            return Response({"detail": "Recipient and message are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipient = User.objects.get(username=recipient_username)
        except User.DoesNotExist:
            return Response({"detail": "Recipient does not exist."}, status=status.HTTP_404_NOT_FOUND)

        chat_message = ChatMessage.objects.create(sender=sender, recipient=recipient, message=message)
        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def get_chats(self, request):
        user = request.user
        sent_messages = ChatMessage.objects.filter(sender=user)
        received_messages = ChatMessage.objects.filter(recipient=user)

        unique_senders = sent_messages.values_list("recipient__username", flat=True).distinct()
        unique_recipients = received_messages.values_list("sender__username", flat=True).distinct()
        unique_users = set(unique_senders).union(set(unique_recipients))

        chats = []
        for username in unique_users:
            latest_message = ChatMessage.objects.filter(
                Q(sender=user, recipient__username=username) | Q(sender__username=username, recipient=user)
            ).order_by("-timestamp").first()
            if latest_message:
                chats.append({
                    "owner": username,
                    "lastMessage": latest_message.message,
                    "timestamp": latest_message.timestamp,
                })

        chats.sort(key=lambda x: x["timestamp"], reverse=True)
        return Response(chats)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_as_read(self, request):
        user = request.user
        other_username = request.data.get("other_username")

        if other_username:
            try:
                other_user = User.objects.get(username=other_username)
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=404)
            updated = ChatMessage.objects.filter(sender=other_user, recipient=user, is_read=False).update(is_read=True)
        else:
            updated = ChatMessage.objects.filter(recipient=user, is_read=False).update(is_read=True)

        return Response({"status": f"{updated} messages marked as read."}, status=200)

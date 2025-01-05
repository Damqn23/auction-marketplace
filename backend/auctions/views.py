from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import AuctionItem
from .serializers import UserSerializer
from .serializers import AuctionItemSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from django.contrib.auth.models import User
from .models import AuctionItem
from .serializers import AuctionItemSerializer, UserRegistrationSerializer
from rest_framework.parsers import MultiPartParser, FormParser 
from .permissions import IsOwnerOrReadOnly  # Import the custom permission

class AuctionItemViewSet(viewsets.ModelViewSet):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

from rest_framework.views import APIView

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
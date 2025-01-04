from django.shortcuts import render
from rest_framework import viewsets
from .models import AuctionItem
from .serializers import AuctionItemSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser 

class AuctionItemViewSet(viewsets.ModelViewSet):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# auctions/serializers.py

from rest_framework import serializers
from .models import AuctionItem
from django.contrib.auth.models import User

class AuctionItemSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = AuctionItem
        fields = ['id', 'title', 'description', 'starting_bid', 'current_bid', 'image', 'status', 'created_at', 'updated_at', 'owner']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        else:
            representation['image'] = None
        return representation

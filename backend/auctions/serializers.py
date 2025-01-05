# auctions/serializers.py

from rest_framework import serializers
from .models import AuctionItem, Bid
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password



class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        user.set_password(validated_data['password'])
        user.save()

        return user
    



class BidSerializer(serializers.ModelSerializer):
    bidder = serializers.ReadOnlyField(source='bidder.username')
    auction_item = serializers.ReadOnlyField(source='auction_item.id')

    class Meta:
        model = Bid
        fields = ['id', 'auction_item', 'bidder', 'amount', 'timestamp']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        bids = BidSerializer(many=True, read_only=True)
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'bids']


class AuctionItemSerializer(serializers.ModelSerializer):    
    owner = serializers.ReadOnlyField(source='owner.username')
    image = serializers.ImageField(required=False, allow_null=True)
    bids = BidSerializer(many=True, read_only=True)

    class Meta:
        model = AuctionItem
        fields = ['id', 'title', 'description', 'starting_bid', 'current_bid', 'image', 'status', 'owner', 'bids', 'end_time']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        else:
            representation['image'] = None
        return representation
    
    
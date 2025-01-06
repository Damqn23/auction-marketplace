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
    timestamp = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z")  # Ensure proper format

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
    bids = BidSerializer(many=True, read_only=True)
    buy_now_buyer = UserSerializer(read_only=True)  # Include buyer details if purchased via Buy Now
    winner = UserSerializer(read_only=True)

    class Meta:
        model = AuctionItem
        fields = [
            'id',
            'title',
            'description',
            'starting_bid',
            'current_bid',
            'image',
            'status',
            'owner',
            'bids',
            'end_time',
            'buy_now_price',
            'buy_now_buyer',
            'winner',  
        ]
        read_only_fields = ['status', 'buy_now_buyer', 'winner']  # Make these fields read-only

    def validate(self, data):
        """
        Ensure that buy_now_price is higher than starting_bid.
        """
        buy_now_price = data.get('buy_now_price')
        starting_bid = data.get('starting_bid', getattr(self.instance, 'starting_bid', None))

        if buy_now_price is not None and starting_bid is not None:
            if buy_now_price <= starting_bid:
                raise serializers.ValidationError("Buy Now price must be higher than the starting bid.")

        return data
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        else:
            representation['image'] = None
        return representation
    
    
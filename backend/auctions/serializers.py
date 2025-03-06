# auctions/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import AuctionItem, Bid, AuctionImage, ChatMessage, Category, Favorite


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            "username",
            "password",
            "password2",
            "email",
            "first_name",
            "last_name",
        )
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "email": {"required": False},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )

        user.set_password(validated_data["password"])
        user.save()

        return user


class BidSerializer(serializers.ModelSerializer):
    bidder = serializers.ReadOnlyField(source="bidder.username")
    auction_item = serializers.ReadOnlyField(source="auction_item.title")
    timestamp = serializers.DateTimeField(
        format="%Y-%m-%dT%H:%M:%S%z"
    )  # Ensure proper format

    class Meta:
        model = Bid
        fields = ["id", "auction_item", "bidder", "amount", "timestamp"]


class UserSerializer(serializers.ModelSerializer):
    bids = BidSerializer(many=True, read_only=True)  # Moved outside Meta

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "bids"]


class AuctionImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = AuctionImage
        fields = ["id", "image"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class AuctionItemSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)  # Serialize 'owner' as a nested object
    bids = BidSerializer(many=True, read_only=True)
    images = AuctionImageSerializer(many=True, read_only=True)
    buy_now_buyer = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    category_data = CategorySerializer(source="category", read_only=True)
    condition = serializers.CharField()
    location = serializers.CharField()

    class Meta:
        model = AuctionItem
        fields = [
            "id",
            "title",
            "description",
            "starting_bid",
            "current_bid",
            "buy_now_price",
            "buy_now_buyer",
            "owner",
            "image",
            "images",
            "status",
            "end_time",
            "winner",
            "bids",
            "category",
            "category_data",
            "condition",
            "location",
            "shipping_status",
            "verified",
        ]
        read_only_fields = [
            "status",
            "buy_now_buyer",
            "winner",
            "shipping_status",
            "verified",
        ]

    def validate(self, data):
        """
        Ensure that buy_now_price is higher than starting_bid.
        """
        buy_now_price = data.get("buy_now_price")
        starting_bid = data.get(
            "starting_bid", getattr(self.instance, "starting_bid", None)
        )
        if buy_now_price is not None and starting_bid is not None:
            if buy_now_price <= starting_bid:
                raise serializers.ValidationError(
                    "Buy Now price must be higher than the starting bid."
                )
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get("request")

        # Override the status with effective_status (closed if the end_time has passed)
        representation["status"] = instance.effective_status

        # Add computed highest bid information
        highest_bid = instance.bids.order_by("-amount").first()
        if highest_bid:
            representation["top_bid"] = str(highest_bid.amount)
            representation["top_bidder"] = highest_bid.bidder.username
        else:
            representation["top_bid"] = None
            representation["top_bidder"] = None

        # Determine if the current request.user is the highest bidder
        if request and hasattr(request, "user") and request.user.is_authenticated:
            representation["is_winning"] = bool(
                highest_bid and highest_bid.bidder == request.user
            )
        else:
            representation["is_winning"] = False

        # Serialize the main image properly
        if instance.image and request:
            representation["image"] = request.build_absolute_uri(instance.image.url)
        else:
            representation["image"] = None

        # Process additional images
        if "images" in representation:
            for img in representation["images"]:
                if "image" in img and img["image"]:
                    img["image"] = request.build_absolute_uri(img["image"])
        return representation


class FavoriteSerializer(serializers.ModelSerializer):
    # Return full auction item details for GET requests
    auction_item = AuctionItemSerializer(read_only=True)
    # Allow posting using auction_item_id
    auction_item_id = serializers.PrimaryKeyRelatedField(
        source="auction_item", queryset=AuctionItem.objects.all(), write_only=True
    )

    class Meta:
        model = Favorite
        fields = ["id", "auction_item", "auction_item_id", "created_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source="sender.username", read_only=True)
    recipient = serializers.CharField(source="recipient.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "recipient", "message", "timestamp", "is_read"]

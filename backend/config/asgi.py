import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import re_path
from channels.auth import AuthMiddlewareStack
from auctions.consumers import ChatConsumer, BalanceConsumer
from auctions.middleware import JWTAuthMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": URLRouter(
            [
                # Chat endpoint uses session authentication
                re_path(
                    r"^ws/chat/(?P<room_name>\w+)/$",
                    AuthMiddlewareStack(ChatConsumer.as_asgi()),
                ),
                # Balance endpoint uses JWT authentication via our custom middleware
                re_path(r"^ws/balance/$", JWTAuthMiddleware(BalanceConsumer.as_asgi())),
            ]
        ),
    }
)

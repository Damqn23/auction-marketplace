# auctions/middleware.py
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


@database_sync_to_async
def get_user_from_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return User.objects.get(id=payload.get("user_id"))
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = None
        if query_string:
            params = dict(
                item.split("=") for item in query_string.split("&") if "=" in item
            )
            token = params.get("token")
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
        return await super().__call__(scope, receive, send)

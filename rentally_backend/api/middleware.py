"""
Custom middleware for Rentally API.
"""

import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('api')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all requests with timing information.
    """

    def process_request(self, request):
        request.start_time = time.time()
        return None

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(
                f"{request.method} {request.path} {response.status_code} - {duration:.3f}s"
            )
        return response

# WebSocket Auth Middleware

import urllib.parse
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.payload.get('user_id')
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class WebSocketJWTAuthMiddleware(BaseMiddleware):
    """
    Middleware that extracts JWT token from query parameters and authenticates the user
    for WebSockets.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

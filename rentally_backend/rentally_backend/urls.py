"""
URL configuration for rentally_backend project.
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.http import JsonResponse


def health_check(request):
    """Health check endpoint for monitoring."""
    return JsonResponse({"status": "ok", "service": "rentally-api"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', health_check, name='health-check'),
]

# Debug toolbar in development

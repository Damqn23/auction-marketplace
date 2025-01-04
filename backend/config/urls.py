# config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import home_view  # Import the root view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('auctions.urls')),  # Include auctions app URLs under /api/
    path('', home_view, name='home'),        # Handle root URL
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

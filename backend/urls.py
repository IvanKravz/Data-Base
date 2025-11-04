from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/users/', include('users.urls')),
    path('api/equipment/', include('equipment.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/networks/', include('networks.urls')),
    path('api/map/', include('map.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
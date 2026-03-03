# urls.py
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin

# Импортируем обработчики ошибок из существующего приложения
from users.views import error_400, error_403, error_404, error_500

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/equipment/', include('equipment.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/networks/', include('networks.urls')),
    path('api/map/', include('map.urls')),
    path('api/storage/', include('storage.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler400 = error_400
handler403 = error_403
handler404 = error_404
handler500 = error_500
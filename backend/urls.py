from django.urls import path, include

urlpatterns = [
    path('api/users/', include('users.urls')),
    path('api/equipment/', include('equipment.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/tasks/', include('tasks.urls')),
]
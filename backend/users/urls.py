# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, TokenObtainPairView, TokenRefreshView, RegisterView, UserProfileView,
    AvailableModulesView, SystemInfoView, UserActionLogViewSet, logout_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    
    # User profile and permissions
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/modules/', AvailableModulesView.as_view(), name='available-modules'),
    
    # System info
    path('system/info/', SystemInfoView.as_view(), name='system-info'),
    
    # ЯВНЫЕ маршруты для логов действий пользователя
    path('action-logs/', UserActionLogViewSet.as_view({'get': 'list'}), name='action-logs-list'),
    path('action-logs/action-choices/', UserActionLogViewSet.as_view({'get': 'action_choices'}), name='action-logs-action-choices'),
    path('action-logs/stats/', UserActionLogViewSet.as_view({'get': 'stats'}), name='action-logs-stats'),
    path('action-logs/export/', UserActionLogViewSet.as_view({'get': 'export'}), name='action-logs-export'),
    path('action-logs/storage-stats/', UserActionLogViewSet.as_view({'get': 'storage_stats'}), name='action-logs-storage-stats'),
    path('action-logs/file-types/', UserActionLogViewSet.as_view({'get': 'file_types'}), name='action-logs-file-types'),
    path('action-logs/storage-locations/', UserActionLogViewSet.as_view({'get': 'storage_locations'}), name='action-logs-storage-locations'),
    path('action-logs/bulk-delete/', UserActionLogViewSet.as_view({'post': 'bulk_delete_logs'}), name='action-logs-bulk-delete'),
    path('auth/logout/', logout_view, name='logout'),
    
    # Новый явный маршрут для получения доступных ролей (простой путь)
    path('roles/', UserViewSet.as_view({'get': 'available_roles'}), name='user-available-roles'),
    
    # Include router URLs для остальных ресурсов (включая users/)
    path('', include(router.urls)),
]
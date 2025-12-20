from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeDictionariesView, EmployeePhotoView, EmployeeViewSet, 
    ShaWorkerViewSet, ShaEquipmentConclusionViewSet, TokenObtainPairView, 
    TokenRefreshView, RegisterView, UserViewSet, UserProfileView, AvailableModulesView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'sha-workers', ShaWorkerViewSet, basename='shaworker')
router.register(r'sha-equipment-conclusions', ShaEquipmentConclusionViewSet, basename='shaequipment')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    
    # User profile and permissions
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/modules/', AvailableModulesView.as_view(), name='available-modules'),
    
    # Employee related
    path('employees/<int:pk>/photo/', EmployeePhotoView.as_view(), name='employee-photo'),
    path('employees/dictionaries/', EmployeeDictionariesView.as_view(), name='employee-dictionaries'),
    
    
    
    # User management endpoints
    path('', include(router.urls)),
]

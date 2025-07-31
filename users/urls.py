from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .views import EmployeeDictionariesView, EmployeePhotoView, EmployeeViewSet, ShaWorkerViewSet, ShaEquipmentConclusionViewSet, TokenObtainPairView, TokenRefreshView, RegisterView, UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'sha-workers', ShaWorkerViewSet)
router.register(r'sha-equipment-conclusions', ShaEquipmentConclusionViewSet)

urlpatterns = [
    # Authentication endpoints
    path('admin/', admin.site.urls),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Маршруты для EmployeeViewSet
    path('employees/<int:pk>/photo/', EmployeePhotoView.as_view(), name='employee-photo'),
    path('employees/', EmployeeViewSet.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeViewSet.as_view(), name='employee-detail'),
    path('employees/dictionaries/', EmployeeDictionariesView.as_view()),
    
    
    
    # User management endpoints
    path('', include(router.urls)),
]

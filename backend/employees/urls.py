# employees/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, ShaWorkerViewSet, ShaEquipmentConclusionViewSet, EmployeeDictionariesView, EmployeePhotoView

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')
router.register(r'sha-workers', ShaWorkerViewSet, basename='shaworker')
router.register(r'sha-equipment-conclusions', ShaEquipmentConclusionViewSet, basename='shaequipment')

urlpatterns = [
    path('<int:pk>/photo/', EmployeePhotoView.as_view(), name='employee-photo'),
    path('dictionaries/', EmployeeDictionariesView.as_view(), name='employee-dictionaries'),
    path('', include(router.urls)),
]
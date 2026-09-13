# employees/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, ShaWorkerViewSet, ShaEquipmentConclusionViewSet, EmployeeDictionariesView, EmployeePhotoView, ScheduleEventViewSet

router = DefaultRouter()
router.register(r'schedule-events', ScheduleEventViewSet, basename='schedule-event')
router.register(r'sha-workers', ShaWorkerViewSet, basename='shaworker')
router.register(r'sha-equipment-conclusions', ShaEquipmentConclusionViewSet, basename='shaequipment')
router.register(r'', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('<int:pk>/photo/', EmployeePhotoView.as_view(), name='employee-photo'),
    path('dictionaries/', EmployeeDictionariesView.as_view(), name='employee-dictionaries'),
    path('', include(router.urls)),
]
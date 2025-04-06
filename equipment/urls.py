from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EquipmentViewSet

router = DefaultRouter()
router.register(r'', EquipmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('assigned_to/<int:employee_id>/', EquipmentViewSet.as_view({'get': 'list_by_employee'}), name='equipment-assigned-to'),
]
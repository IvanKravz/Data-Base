from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommunicationNetworkViewSet,
    NetworkDirectionViewSet, 
    VLANViewSet, 
    NetworkInterfaceViewSet, 
    IPAddressViewSet, 
    IPRangeViewSet,
    NetworkMembershipViewSet  # Добавляем импорт NetworkMembershipViewSet
)

router = DefaultRouter()
router.register(r'vlans', VLANViewSet)
router.register(r'network-interfaces', NetworkInterfaceViewSet)
router.register(r'ip-addresses', IPAddressViewSet)
router.register(r'ip-ranges', IPRangeViewSet)
router.register(r'network-memberships', NetworkMembershipViewSet)
router.register(r'network-directions', NetworkDirectionViewSet)
router.register(r'', CommunicationNetworkViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
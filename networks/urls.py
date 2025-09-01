from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommunicationNetworkViewSet, 
    VLANViewSet, 
    NetworkInterfaceViewSet, 
    IPAddressViewSet, 
    IPRangeViewSet
)

router = DefaultRouter()
router.register(r'', CommunicationNetworkViewSet)
router.register(r'vlans', VLANViewSet)
router.register(r'network-interfaces', NetworkInterfaceViewSet)
router.register(r'ip-addresses', IPAddressViewSet)
router.register(r'ip-ranges', IPRangeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
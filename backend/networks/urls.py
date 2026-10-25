from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    ACLViewSet,
    CommunicationNetworkViewSet,
    IPAddressViewSet,
    NetworkDirectionViewSet,
    NetworkInterfaceViewSet,
    NetworkMembershipViewSet,
    RoutingTableViewSet,
    SubnetViewSet,
    VLANConfigurationViewSet,
    VLANViewSet,
)

router = SimpleRouter()

# Все subroutes под /api/networks/<sub>/
router.register(r'network-memberships', NetworkMembershipViewSet, basename='network-membership')
router.register(r'network-directions', NetworkDirectionViewSet, basename='network-direction')
router.register(r'vlans', VLANViewSet, basename='vlan')
router.register(r'network-interfaces', NetworkInterfaceViewSet, basename='network-interface')
router.register(r'subnets', SubnetViewSet, basename='subnet')
router.register(r'ip-addresses', IPAddressViewSet, basename='ip-address')
router.register(r'vlan-configurations', VLANConfigurationViewSet, basename='vlan-configuration')
router.register(r'routing-table', RoutingTableViewSet, basename='routing-table')
router.register(r'acls', ACLViewSet, basename='acl')

# Явные роуты CommunicationNetwork — без router
_network_list = CommunicationNetworkViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
_network_detail = CommunicationNetworkViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})
_network_get_network = CommunicationNetworkViewSet.as_view({
    'get': 'get_network',
})

urlpatterns = [
    # Subroutes — СНАЧАЛА. Иначе /api/networks/vlans/ попадёт в detail pk='vlans'
    path('', include(router.urls)),

    # CRUD сети — /api/networks/ и /api/networks/<id>/
    path('', _network_list, name='network-list'),
    path('<int:pk>/', _network_detail, name='network-detail'),
    path('<int:pk>/get_network/', _network_get_network, name='network-get-network'),
]
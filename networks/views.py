from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import CommunicationNetwork, VLAN, NetworkInterface, IPAddress, IPRange, VLANConfiguration, RoutingTable, ACL
from .serializers import (
    CommunicationNetworkSerializer, 
    VLANSerializer, 
    NetworkInterfaceSerializer, 
    IPAddressSerializer, 
    IPRangeSerializer,
    VLANConfigurationSerializer,
    RoutingTableSerializer,
    ACLSerializer
)

class CommunicationNetworkViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CommunicationNetwork.objects.all().prefetch_related(
        'divisions', 'subdivisions', 'facilities', 'equipment'
    )
    serializer_class = CommunicationNetworkSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'network_class': ['exact'],
        'security_level': ['exact'],
        'protocol': ['exact'],
        'ip_range': ['icontains'],
        'throughput': ['gte', 'lte'],
    }
    search_fields = ['name', 'description', 'ip_range']
    ordering_fields = ['name', 'network_class', 'security_level', 'throughput']
    ordering = ['name']

class VLANViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLAN.objects.all()
    serializer_class = VLANSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vlan_id']
    search_fields = ['name', 'description']
    ordering_fields = ['vlan_id', 'name']
    ordering = ['vlan_id']

class NetworkInterfaceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkInterface.objects.select_related('equipment', 'vlan')
    serializer_class = NetworkInterfaceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment', 'interface_type', 'enabled', 'vlan']
    search_fields = ['name', 'mac_address']
    ordering_fields = ['name', 'equipment']
    ordering = ['equipment', 'name']

class IPAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IPAddress.objects.select_related('interface', 'interface__equipment')
    serializer_class = IPAddressSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['interface', 'version', 'is_primary']
    search_fields = ['address', 'gateway']
    ordering_fields = ['address', 'interface']
    ordering = ['interface', 'address']

class IPRangeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IPRange.objects.prefetch_related('devices', 'vlan')
    serializer_class = IPRangeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vlan']
    search_fields = ['network', 'description']
    ordering_fields = ['network', 'created_at']
    ordering = ['network']

class VLANConfigurationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLANConfiguration.objects.select_related('interface', 'vlan')
    serializer_class = VLANConfigurationSerializer

class RoutingTableViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RoutingTable.objects.select_related('equipment', 'interface')
    serializer_class = RoutingTableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']

class ACLViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ACL.objects.select_related('equipment')
    serializer_class = ACLSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']
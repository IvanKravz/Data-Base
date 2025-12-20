from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import CommunicationNetwork, VLAN, NetworkDirection, NetworkInterface, IPAddress, IPRange, NetworkMembership, VLANConfiguration, RoutingTable, ACL
from .serializers import (
    CommunicationNetworkSerializer,
    NetworkDirectionBulkCreateSerializer,
    NetworkDirectionSerializer,
    NetworkMembershipSerializer, 
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
        'memberships__division',
        'memberships__facility',
        'memberships__equipment'
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

    def get_queryset(self):
        queryset = super().get_queryset()
        division_id = self.request.query_params.get('division')
        if division_id:
            queryset = queryset.filter(memberships__division_id=division_id)
        return queryset.distinct()

    @action(detail=True, methods=['get'])
    def get_network(self, request, pk=None):
        """Получение одной сети по ID"""
        try:
            network = self.get_object()
            serializer = self.get_serializer(network)
            return Response(serializer.data)
        except CommunicationNetwork.DoesNotExist:
            return Response({'error': 'Network not found'}, status=404)

class NetworkMembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkMembership.objects.all()
    serializer_class = NetworkMembershipSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Массовое создание связей"""
        network_id = request.data.get('network')
        memberships = request.data.get('memberships', [])
        
        # Удаляем старые связи
        NetworkMembership.objects.filter(network_id=network_id).delete()
        
        # Создаем новые связи
        created = []
        for membership in memberships:
            # Преобразуем старые поля в новые
            if 'division' in membership:
                membership['division_id'] = membership.pop('division')
            if 'facility' in membership:
                membership['facility_id'] = membership.pop('facility')
            if 'equipment' in membership:
                membership['equipment_id'] = membership.pop('equipment')
                
            # Добавляем network_id к данным
            membership_data = {
                **membership,
                'network': network_id
            }
            
            serializer = self.get_serializer(data=membership_data)
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                return Response(serializer.errors, status=400)
        
        return Response(created, status=201)


class NetworkDirectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkDirection.objects.select_related(
        'from_membership__division',
        'from_membership__facility',
        'from_membership__equipment',
        'to_membership__division',
        'to_membership__facility',
        'to_membership__equipment'
    )
    serializer_class = NetworkDirectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Массовое создание направлений"""
        serializer = NetworkDirectionBulkCreateSerializer(data=request.data)
        if serializer.is_valid():
            directions = serializer.save()
            return Response(
                NetworkDirectionSerializer(directions, many=True).data,
                status=201
            )
        return Response(serializer.errors, status=400)


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
    queryset = NetworkInterface.objects.select_related('equipment', 'access_vlan', 'native_vlan')
    serializer_class = NetworkInterfaceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment', 'interface_type', 'enabled', 'access_vlan', 'native_vlan']  # Исправлено здесь
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
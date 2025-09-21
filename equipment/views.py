from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from .models import Equipment, EquipmentCategory
from .serializers import (
    ACLSerializer,
    EquipmentSerializer, 
    EquipmentStatsSerializer, 
    EquipmentCategorySerializer,
    IPAddressSerializer,
    NetworkInterfaceSerializer,
    RoutingTableSerializer,
    VLANSerializer
)
from users.models import Employee
from facilities.models import Facility
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from django.apps import apps

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.select_related(
        'division', 'subdivision', 'facility', 'assigned_to', 'category'
    ).prefetch_related(
        'product_structures', 
        'net_interfaces',
        'net_interfaces__ip_addresses',
        'vlans',
        'routing_table',
        'acls',
        'category'
    ).annotate(
        network_interfaces_count=Count('net_interfaces'),
        ip_addresses_count=Count('net_interfaces__ip_addresses')
    )
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['facility', 'is_network', 'status']
    pagination_class = None 

    def get_queryset(self):
        queryset = super().get_queryset()
        
        user_division = None
        if not self.request.user.is_staff:
            user_division = getattr(self.request.user, 'employee', None) and self.request.user.employee.division
        
        if user_division:
            queryset = queryset.filter(division=user_division)
        
        division = self.request.query_params.get('division', None)
        category = self.request.query_params.get('category', None)
        status = self.request.query_params.get('status', None)
        type = self.request.query_params.get('type', None)
        search = self.request.query_params.get('search', None)
        facility = self.request.query_params.get('facility', None)
        is_network = self.request.query_params.get('is_network', None)

        if division:
            queryset = queryset.filter(division=division)

        if category:
            queryset = queryset.filter(category__value=category)

        if status:
            queryset = queryset.filter(status=status)

        if type == 'open':
            queryset = queryset.filter(is_closed=False)
        elif type == 'closed':
            queryset = queryset.filter(is_closed=True)

        if facility:
            queryset = queryset.filter(facility=facility)

        if is_network:
            queryset = queryset.filter(is_network=is_network.lower() == 'true')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(serial_number__icontains=search) |
                Q(inventory_number__icontains=search) |
                Q(assigned_to__name__icontains=search) |
                Q(net_interfaces__name__icontains=search) |
                Q(net_interfaces__ip_addresses__address__icontains=search)
            ).distinct()

        return queryset
    
    @action(detail=True, methods=['post'])
    def dispose(self, request, pk=None):
        equipment = self.get_object()
        disposal_info = request.data
        
        equipment.status = 'disposed'
        equipment.disposal_act_number = disposal_info.get('actNumber')
        equipment.disposal_act_date = disposal_info.get('actDate')
        equipment.disposal_cert_number = disposal_info.get('disposalCertNumber')
        equipment.disposal_cert_date = disposal_info.get('disposalCertDate')
        equipment.disposal_comments = disposal_info.get('comments')
        equipment.save()
        
        serializer = self.get_serializer(equipment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        equipment = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            user = Employee.objects.get(id=user_id)
            equipment.assigned_to = user
            equipment.save()
            serializer = self.get_serializer(equipment)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        equipment = self.get_object()
        facility_id = request.data.get('facility_id')
        
        if facility_id:
            facility = get_object_or_404(Facility, id=facility_id)
            equipment.facility = facility
        else:
            equipment.facility = None
            
        equipment.save()
        serializer = self.get_serializer(equipment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'by_category': dict(queryset.values('category__name').annotate(count=Count('id')).values_list('category__name', 'count')),
            'by_status': dict(queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_division': dict(queryset.values('division__name').annotate(count=Count('id')).values_list('division__name', 'count')),
            'network_equipment_count': queryset.filter(is_network=True).count(),
            'network_interfaces_total': sum(equip.network_interfaces_count for equip in queryset if equip.network_interfaces_count),
            'ip_addresses_total': sum(equip.ip_addresses_count for equip in queryset if equip.ip_addresses_count),
        }
        serializer = EquipmentStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def equipment_categories(self, request):
        categories = EquipmentCategory.objects.all()
        serializer = EquipmentCategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def comments(self, request, pk=None):
        equipment = self.get_object()
        equipment.comments = request.data.get('comments', '')
        equipment.save()
        serializer = self.get_serializer(equipment)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='assigned_to/(?P<employee_id>[^/.]+)')
    def list_by_employee(self, request, employee_id=None):
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(assigned_to_id=employee_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def network_config(self, request, pk=None):
        """Получить полную сетевую конфигурацию оборудования"""
        equipment = self.get_object()
        
        if not equipment.is_network:
            return Response({'error': 'Оборудование не является сетевым'}, status=400)
        
        NetworkInterface = apps.get_model('networks', 'NetworkInterface')
        VLAN = apps.get_model('networks', 'VLAN')
        RoutingTable = apps.get_model('networks', 'RoutingTable')
        ACL = apps.get_model('networks', 'ACL')
        
        config = {
            'equipment': self.get_serializer(equipment).data,
            'interfaces': [],
            'vlans': VLANSerializer(equipment.vlans.all(), many=True).data,
            'routing_table': RoutingTableSerializer(equipment.routing_table.all(), many=True).data,
            'acls': ACLSerializer(equipment.acls.all(), many=True).data,
        }
        
        interfaces = equipment.net_interfaces.all().prefetch_related('ip_addresses', 'vlan_configurations')
        for interface in interfaces:
            interface_data = NetworkInterfaceSerializer(interface).data
            interface_data['ip_addresses'] = IPAddressSerializer(interface.ip_addresses.all(), many=True).data
            config['interfaces'].append(interface_data)
        
        return Response(config)
    
    @action(detail=False, methods=['get'])
    def shd_equipment(self, request):
        """Получить технику категории SHD"""
        shd_category = get_object_or_404(EquipmentCategory, value='shd')
        equipment = Equipment.objects.filter(category=shd_category)
        
        # Фильтрация по подразделению и объекту
        division_id = request.query_params.get('division')
        facility_id = request.query_params.get('facility')
        
        if division_id:
            equipment = equipment.filter(division_id=division_id)
        if facility_id:
            equipment = equipment.filter(facility_id=facility_id)
        
        serializer = self.get_serializer(equipment, many=True)
        return Response(serializer.data)    
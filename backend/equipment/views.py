from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from users.permissions import RoleBasedPermission
from .models import Equipment, EquipmentCategory, InterestOrgan
from .serializers import (
    ACLSerializer,
    EquipmentSerializer, 
    EquipmentStatsSerializer, 
    EquipmentCategorySerializer,
    IPAddressSerializer,
    InterestOrganSerializer,
    NetworkInterfaceSerializer,
    RoutingTableSerializer,
    VLANSerializer
)
from users.models import Employee
from facilities.models import Facility
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from django.apps import apps
from facilities.serializers import FacilityShortSerializer
from users.permissions_config import ROLE_PERMISSIONS 

class InterestOrganViewSet(viewsets.ModelViewSet):
    queryset = InterestOrgan.objects.all()
    serializer_class = InterestOrganSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]  # ДОБАВИТЬ RoleBasedPermission
    pagination_class = None

    def get_queryset(self):
        """Получить все органы интересов"""
        return InterestOrgan.objects.all().order_by('name')

    def list(self, request, *args, **kwargs):
        """Переопределить метод list для возврата всех записей"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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
        'category',
        'networkmembership_set__network', 
    ).annotate(
        network_interfaces_count=Count('net_interfaces'),
        ip_addresses_count=Count('net_interfaces__ip_addresses')
    )
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['facility', 'is_network', 'status']
    pagination_class = None 

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Для администраторов и суперпользователей показываем все оборудование
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        
        # Используем RoleBasedPermission для проверки прав
        permission_checker = RoleBasedPermission()
        
        # Проверяем, может ли пользователь видеть все подразделения
        user_roles = permission_checker._get_user_roles(self.request.user)
        can_see_all = any(
            role in ['admin', 'leader', 'deputy_director'] or
            ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
            for role in user_roles
        )
        
        # Если пользователь не может видеть все подразделения, фильтруем по его подразделению
        if not can_see_all:
            user_division = getattr(self.request.user, 'division', None)
            if not user_division and hasattr(self.request.user, 'employee') and self.request.user.employee:
                user_division = getattr(self.request.user.employee, 'division', None)
                
            if user_division:
                queryset = queryset.filter(division=user_division)
            else:
                # Если у пользователя нет подразделения и он не может видеть все - пустой результат
                queryset = queryset.none()
        
        # Остальная логика фильтрации (поиск, категории и т.д.)
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
    
    def has_permission_for_custom_action(self, request, model_name, action):
        """Проверяет права для кастомных действий"""
        permission_checker = RoleBasedPermission()
        return permission_checker._check_permission(request.user, model_name, action)

    @action(detail=False, methods=['get'], url_path='facilities-by-division')
    def get_facilities_by_division(self, request):
        """Получить объекты по подразделению"""
        division_id = request.query_params.get('division_id')
        
        if not division_id:
            return Response(
                {'error': 'division_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            facilities = Facility.objects.filter(division_id=division_id)
            serializer = FacilityShortSerializer(facilities, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
    
    @action(detail=False, methods=['get'])
    def equipment_categories(self, request):
        """Получить категории оборудования"""
        # Проверяем права через RoleBasedPermission для модели EquipmentCategory
        if not self.has_permission_for_custom_action(request, 'EquipmentCategory', 'list'):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
        """Получить оборудование по назначенному сотруднику"""
        # Проверяем права через RoleBasedPermission для модели Equipment
        if not self.has_permission_for_custom_action(request, 'Equipment', 'list'):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
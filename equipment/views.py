from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from .models import Equipment, OpenEquipmentCategory, ClosedEquipmentCategory
from .serializers import (
    EquipmentSerializer, 
    EquipmentStatsSerializer, 
    OpenEquipmentCategorySerializer,
    ClosedEquipmentCategorySerializer
)
from users.models import Employee
from facilities.models import Facility
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.select_related(
        'division', 'subdivision', 'facility', 'assigned_to'
    ).prefetch_related('open_category', 'closed_category')
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['facility']  # Добавляем фильтр по facility

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Получаем подразделение пользователя (если не администратор)
        user_division = None
        if not self.request.user.is_staff:
            user_division = getattr(self.request.user, 'employee', None) and self.request.user.employee.division
        
        # Фильтрация по подразделению пользователя
        if user_division:
            queryset = queryset.filter(division=user_division)
        
        # Получаем параметры запроса
        division = self.request.query_params.get('division', None)
        category = self.request.query_params.get('category', None)
        status = self.request.query_params.get('status', None)
        type = self.request.query_params.get('type', None)
        search = self.request.query_params.get('search', None)
        facility = self.request.query_params.get('facility', None)

        # Фильтрация по division (если передан в запросе)
        if division:
            queryset = queryset.filter(division=division)

        # Фильтрация по category
        if category:
            queryset = queryset.filter(
                Q(open_category__value=category) | 
                Q(closed_category__name=category)
            )

        # Фильтрация по status
        if status:
            queryset = queryset.filter(status=status)

        # Фильтрация по type (open или closed)
        if type == 'open':
            queryset = queryset.filter(is_closed=False)
        elif type == 'closed':
            queryset = queryset.filter(is_closed=True)

        # Фильтрация по facility
        if facility:
            queryset = queryset.filter(facility=facility)

        # Поиск по name, serial_number, inventory_number, assigned_to
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(serial_number__icontains=search) |
                Q(inventory_number__icontains=search) |
                Q(assigned_to__name__icontains=search)
            )

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
            'by_category': dict(queryset.values('open_category').annotate(count=Count('id')).values_list('open_category', 'count')),
            'by_status': dict(queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_division': dict(queryset.values('division__name').annotate(count=Count('id')).values_list('division__name', 'count'))
        }
        serializer = EquipmentStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def equipment_categories(self, request):
        print(">>> Categories endpoint called!")
        # cache_key = 'all_equipment_categories'
        # categories = cache.get(cache_key)
        
        # if not categories:
        open_categories = OpenEquipmentCategory.objects.all()
        closed_categories = ClosedEquipmentCategory.objects.all()
        
        open_serializer = OpenEquipmentCategorySerializer(open_categories, many=True)
        closed_serializer = ClosedEquipmentCategorySerializer(closed_categories, many=True)
        
        categories = {
            'open': open_serializer.data,
            'closed': closed_serializer.data
        }
            # cache.set(cache_key, categories, 60*60*24)  # Кэшируем на 24 часа
        
        return Response(categories)

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
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from .models import Equipment
from .serializers import EquipmentSerializer, EquipmentStatsSerializer
from users.models import Employee, User
from facilities.models import Facility

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Equipment.objects.all()
        
        # Получаем параметры запроса
        division = self.request.query_params.get('division', None)
        category = self.request.query_params.get('category', None)
        status = self.request.query_params.get('status', None)
        type = self.request.query_params.get('type', None)
        search = self.request.query_params.get('search', None)

        # Фильтрация по division
        if division:
            queryset = queryset.filter(division=division)

        # Фильтрация по category
        if category:
            queryset = queryset.filter(open_category=category) | queryset.filter(closed_category__name=category)

        # Фильтрация по status
        if status:
            queryset = queryset.filter(status=status)

        # Фильтрация по type (open или closed)
        if type == 'open':
            queryset = queryset.filter(is_closed=False)
        elif type == 'closed':
            queryset = queryset.filter(is_closed=True)

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
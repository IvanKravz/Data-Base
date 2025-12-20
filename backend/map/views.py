# maps/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from .models import FSBOffice, RUSSIAN_REGIONS
from .serializers import (
    FSBOfficeSerializer, 
    FSBOfficeCreateSerializer,
    RegionOfficesSerializer,
    RegionSerializer
)

class FSBOfficeViewSet(viewsets.ModelViewSet):
    """
    API для работы с территориальными органами ФСБ
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['region', 'is_active']
    search_fields = ['name', 'address', 'region', 'description']
    ordering_fields = ['name', 'region', 'created_at']
    ordering = ['region', 'name']
    
    def get_queryset(self):
        queryset = FSBOffice.objects.all()
        
        # Фильтр по активности (по умолчанию только активные)
        active_only = self.request.query_params.get('active_only', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FSBOfficeCreateSerializer
        return FSBOfficeSerializer
    
    @action(detail=False, methods=['get'])
    def by_region(self, request):
        """
        Получить офисы сгруппированные по регионам
        """
        regions_data = []
        
        # Получаем количество офисов по регионам
        office_counts = FSBOffice.objects.filter(
            is_active=True
        ).values('region').annotate(count=Count('id'))
        
        office_count_dict = {item['region']: item['count'] for item in office_counts}
        
        for region_code, region_name in RUSSIAN_REGIONS:
            offices = FSBOffice.objects.filter(
                region=region_code, 
                is_active=True
            )
            
            if offices.exists() or region_code in office_count_dict:
                regions_data.append({
                    'region': region_code,
                    'offices': FSBOfficeSerializer(offices, many=True).data,
                    'office_count': office_count_dict.get(region_code, 0)
                })
        
        serializer = RegionOfficesSerializer(regions_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def regions(self, request):
        """
        Получить список всех регионов с количеством офисов
        """
        # Получаем количество офисов по регионам
        office_counts = FSBOffice.objects.filter(
            is_active=True
        ).values('region').annotate(count=Count('id'))
        
        office_count_dict = {item['region']: item['count'] for item in office_counts}
        
        regions_data = []
        for region_code, region_name in RUSSIAN_REGIONS:
            regions_data.append({
                'name': region_code,
                'office_count': office_count_dict.get(region_code, 0)
            })
        
        serializer = RegionSerializer(regions_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def region_offices(self, request):
        """
        Получить офисы конкретного региона
        """
        region_name = request.query_params.get('region')
        if not region_name:
            return Response(
                {'error': 'Параметр region обязателен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что регион существует в нашем списке
        valid_regions = [code for code, name in RUSSIAN_REGIONS]
        if region_name not in valid_regions:
            return Response(
                {'error': 'Регион не найден'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        offices = FSBOffice.objects.filter(
            region=region_name, 
            is_active=True
        )
        
        serializer = FSBOfficeSerializer(offices, many=True)
        return Response({
            'region': region_name,
            'offices': serializer.data,
            'office_count': offices.count()
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Поиск офисов по различным параметрам
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        offices = FSBOffice.objects.filter(
            Q(name__icontains=query) |
            Q(address__icontains=query) |
            Q(region__icontains=query) |
            Q(description__icontains=query),
            is_active=True
        )
        
        serializer = FSBOfficeSerializer(offices, many=True)
        return Response(serializer.data)
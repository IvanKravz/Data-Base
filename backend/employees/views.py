# employees/views.py
import logging
from django.utils import timezone as django_timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.db import models

from users.logging import log_user_action
from users.permissions import RoleBasedPermission
from users.mixins import RoleBasedFilterMixin
from .models import Employee, ShaWorkerDetails, ShaEquipmentConclusion
from .serializers import (
    EmployeeSerializer, ShaWorkerDetailsSerializer, 
    ShaEquipmentConclusionSerializer, EmployeeDictionariesSerializer
)

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    """
    Базовый ViewSet с общей логикой для всех моделей
    """
    
    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр"""
        from users.permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            if self.action in ['create', 'update', 'partial_update', 'destroy']:
                raise PermissionDenied('Ваши роли позволяют только просматривать данные без возможности изменений')

    def create(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().destroy(request, *args, **kwargs)


class EmployeeViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления сотрудниками
    """
    queryset = Employee.objects.all().order_by('priority', 'full_name')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['priority', 'full_name', 'category', 'position']
    ordering = ['priority', 'full_name']
    
    def get_queryset(self):
        # Полностью полагаемся на миксин, который применяет фильтрацию на основе ролей
        return super().get_queryset()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    # Логирование создания сотрудника
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_201_CREATED:
            # Логируем создание сотрудника
            employee_data = response.data
            log_user_action(
                user=request.user,
                action='create',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=employee_data.get('id'),
                object_name=employee_data.get('full_name'),
                details={'data': employee_data}
            )
        
        return response
    
    # Логирование обновления сотрудника
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data
        
        response = super().update(request, *args, **kwargs)
        
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            # Логируем обновление сотрудника
            new_data = response.data
            changed_fields = {}
            
            # Определяем измененные поля
            for key in old_data:
                if key in new_data and old_data[key] != new_data[key]:
                    changed_fields[key] = {
                        'old': old_data[key],
                        'new': new_data[key]
                    }
            
            log_user_action(
                user=request.user,
                action='update',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=instance.id,
                object_name=instance.full_name,
                details={
                    'changed_fields': changed_fields,
                    'old_data': old_data,
                    'new_data': new_data
                }
            )
        
        return response
    
    # Логирование частичного обновления сотрудника
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data
        
        response = super().partial_update(request, *args, **kwargs)
        
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            # Логируем частичное обновление сотрудника
            new_data = response.data
            changed_fields = {}
            
            # Определяем измененные поля (только те, что были в запросе)
            for key in request.data:
                if key in old_data and old_data[key] != new_data.get(key):
                    changed_fields[key] = {
                        'old': old_data[key],
                        'new': new_data.get(key)
                    }
            
            log_user_action(
                user=request.user,
                action='update',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=instance.id,
                object_name=instance.full_name,
                details={
                    'changed_fields': changed_fields,
                    'request_data': request.data
                }
            )
        
        return response
    
    # Логирование удаления сотрудника
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        employee_data = EmployeeSerializer(instance).data
        
        response = super().destroy(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_204_NO_CONTENT:
            # Логируем удаление сотрудника
            log_user_action(
                user=request.user,
                action='delete',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=instance.id,
                object_name=instance.full_name,
                details={'deleted_data': employee_data}
            )
        
        return response
    
    # Логирование просмотра деталей сотрудника
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        response = super().retrieve(request, *args, **kwargs)
        
        # Логируем просмотр деталей сотрудника
        log_user_action(
            user=request.user,
            action='view',
            module='employees',
            request=request,
            model_name='Employee',
            object_id=instance.id,
            object_name=instance.full_name,
            details={'viewed_details': True}
        )
        
        return response
    
    # Логирование просмотра списка сотрудников
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # # Логируем просмотр списка сотрудников
        # log_user_action(
        #     user=request.user,
        #     action='view',
        #     module='employees',
        #     request=request,
        #     model_name='Employee',
        #     details={
        #         'list_view': True,
        #         'filters': dict(request.query_params),
        #         'count': response.data.get('count', len(response.data)) if isinstance(response.data, dict) else len(response.data)
        #     }
        # )
        
        return response
    
    @action(detail=False, methods=['get'])
    def dictionaries(self, request):
        """Возвращает справочники для формы сотрудника"""
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_officer_positions()],
            'warrant_officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_warrant_officer_positions()],
            'civilian_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_civilian_positions()],
            'management_officer_ranks': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_officer_ranks()],
            'officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_officer_ranks()],
            'warrant_officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_warrant_officer_ranks()],
        }
        serializer = EmployeeDictionariesSerializer(data)
        return Response(serializer.data)


class ShaWorkerViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления ШаРаботниками
    """
    queryset = ShaWorkerDetails.objects.all()
    serializer_class = ShaWorkerDetailsSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class ShaEquipmentConclusionViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления заключениями на технику
    """
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class EmployeeDictionariesView(APIView):
    """
    View для получения справочников сотрудников
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_officer_positions()],
            'warrant_officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_warrant_officer_positions()],
            'civilian_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_civilian_positions()],
            'management_officer_ranks': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_officer_ranks()],
            'officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_officer_ranks()],
            'warrant_officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_warrant_officer_ranks()],
        }
        serializer = EmployeeDictionariesSerializer(data)
        return Response(serializer.data)


class EmployeePhotoView(APIView):
    """
    View для управления фотографиями сотрудников
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр"""
        from users.permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            raise PermissionDenied('Ваши роли позволяют только просматривать данные без возможности изменений')
    
    def patch(self, request, pk):
        self.check_view_only_restrictions()
        
        employee = get_object_or_404(Employee, pk=pk)
        new_photo = request.FILES.get('photo')
        
        if not new_photo:
            return Response(
                {'error': 'No photo provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if employee.photo:
                employee.photo.delete(save=False)
            
            employee.photo = new_photo
            employee.save()
            
            return Response({
                'id': employee.id,
                'photo_url': employee.photo.url if employee.photo else None
            })
            
        except Exception as e:
            return Response(
                {'error': 'Failed to update photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        self.check_view_only_restrictions()
        
        employee = get_object_or_404(Employee, pk=pk)
        
        try:
            if employee.photo:
                employee.delete_photo()
                return Response(
                    {
                        'id': employee.id,
                        'photo_url': None
                    },
                    headers={
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                )
            
            return Response(
                {'error': 'No photo to delete'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to delete photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
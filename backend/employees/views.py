# employees/views.py
import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.db import IntegrityError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone as django_timezone

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.logging import log_user_action
from users.permissions import RoleBasedPermission
from users.mixins import RoleBasedFilterMixin, ALL_ACCESS
from users.permissions_config import ROLE_PERMISSIONS  

from .models import Employee, ScheduleEvent, ShaWorkerDetails, ShaEquipmentConclusion
from .serializers import (
    EmployeeSerializer,
    ScheduleEventSerializer,
    ShaWorkerDetailsSerializer,
    ShaEquipmentConclusionSerializer,
    EmployeeDictionariesSerializer,
)

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    """Базовый ViewSet с общей логикой для всех моделей."""

    def check_view_only_restrictions(self):
        from users.permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            if self.action in ['create', 'update', 'partial_update', 'destroy']:
                raise PermissionDenied(
                    'Ваши роли позволяют только просматривать данные '
                    'без возможности изменений'
                )

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
    """ViewSet для управления сотрудниками."""
    queryset = Employee.objects.all().order_by('priority', 'full_name')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['priority', 'full_name', 'category', 'position']
    ordering = ['priority', 'full_name']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            employee_data = response.data
            log_user_action(
                user=request.user, action='create', module='employees',
                request=request, model_name='Employee',
                object_id=employee_data.get('id'),
                object_name=employee_data.get('full_name'),
                details={'data': employee_data},
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            new_data = response.data
            changed_fields = {}
            for key in old_data:
                if key in new_data and old_data[key] != new_data[key]:
                    changed_fields[key] = {'old': old_data[key], 'new': new_data[key]}
            log_user_action(
                user=request.user, action='update', module='employees',
                request=request, model_name='Employee',
                object_id=instance.id, object_name=instance.full_name,
                details={'changed_fields': changed_fields, 'old_data': old_data, 'new_data': new_data},
            )
        return response

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data
        response = super().partial_update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            new_data = response.data
            changed_fields = {}
            for key in request.data:
                if key in old_data and old_data[key] != new_data.get(key):
                    changed_fields[key] = {'old': old_data[key], 'new': new_data.get(key)}
            log_user_action(
                user=request.user, action='update', module='employees',
                request=request, model_name='Employee',
                object_id=instance.id, object_name=instance.full_name,
                details={'changed_fields': changed_fields, 'request_data': request.data},
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        employee_data = EmployeeSerializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_user_action(
                user=request.user, action='delete', module='employees',
                request=request, model_name='Employee',
                object_id=instance.id, object_name=instance.full_name,
                details={'deleted_data': employee_data},
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_user_action(
            user=request.user, action='view', module='employees',
            request=request, model_name='Employee',
            object_id=instance.id, object_name=instance.full_name,
            details={'viewed_details': True},
        )
        return response

    @action(detail=False, methods=['get'])
    def dictionaries(self, request):
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'management_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_positions()],
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
    queryset = ShaWorkerDetails.objects.all()
    serializer_class = ShaWorkerDetailsSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class ShaEquipmentConclusionViewSet(RoleBasedFilterMixin, BaseViewSet):
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class EmployeeDictionariesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'management_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_positions()],
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
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def check_view_only_restrictions(self):
        from users.permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            raise PermissionDenied(
                'Ваши роли позволяют только просматривать данные '
                'без возможности изменений'
            )

    def patch(self, request, pk):
        self.check_view_only_restrictions()
        employee = get_object_or_404(Employee, pk=pk)
        new_photo = request.FILES.get('photo')
        if not new_photo:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if employee.photo:
                employee.photo.delete(save=False)
            employee.photo = new_photo
            employee.save()
            return Response({
                'id': employee.id,
                'photo_url': f"{settings.MEDIA_URL}{employee.photo.name}" if employee.photo else None,
            })
        except Exception as e:
            logger.exception("Failed to update photo: %s", e)
            return Response({'error': 'Failed to update photo'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        self.check_view_only_restrictions()
        employee = get_object_or_404(Employee, pk=pk)
        try:
            if employee.photo:
                employee.delete_photo()
                return Response(
                    {'id': employee.id, 'photo_url': None},
                    headers={
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                )
            return Response({'error': 'No photo to delete'},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Failed to delete photo: %s", e)
            return Response({'error': 'Failed to delete photo'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ====================================================================== #
# ScheduleEventViewSet                                                   #
# ====================================================================== #

class ScheduleEventViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления событиями графика работы.

    Разделение read/write:
    - get_queryset: для list/retrieve применяется read-фильтр
      (`filters['ScheduleEvent']`), для create/update/partial_update/destroy —
      write-фильтр (`write_filters['ScheduleEvent']`).
    - perform_create/perform_update/bulk_update валидируют доступность
      сотрудника по write-области — даже если пользователь видит чужие
      события при просмотре, изменить он их не сможет (объект вне
      write-области не будет найден get_object'ом → 404).
    - action `available_employees` возвращает список сотрудников по read-области.
    """
    queryset = ScheduleEvent.objects.all()
    serializer_class = ScheduleEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    # ------------------------------------------------------------------ #
    # Вспомогательные методы                                             #
    # ------------------------------------------------------------------ #

    def _get_accessible_employees_qs(self, mode='read', extra_filters=None):
        """
        Queryset сотрудников, события которых доступны пользователю
        в указанном режиме (read / write).
        """
        user = self.request.user
        if not user.is_authenticated:
            return Employee.objects.none()

        perm_checker = RoleBasedPermission()
        if not perm_checker._check_permission(user, 'ScheduleEvent', 'view'):
            return Employee.objects.none()

        if user.is_superuser or perm_checker._user_has_role(user, 'admin'):
            base_qs = Employee.objects.all()
        else:
            result = self._build_role_q('ScheduleEvent', mode=mode)
            if result is None:
                return Employee.objects.none()
            if result is ALL_ACCESS:
                base_qs = Employee.objects.all()
            else:
                emp_q = self._strip_employee_prefix(result)
                base_qs = Employee.objects.filter(emp_q)

        if extra_filters:
            base_qs = base_qs.filter(**extra_filters)
        return base_qs

    @staticmethod
    def _strip_employee_prefix(q):
        """Преобразует Q с ключами `employee__X` в Q с ключами `X`."""
        new_q = Q()
        new_q.connector = q.connector
        new_q.negated = q.negated
        for child in q.children:
            if isinstance(child, tuple):
                key, value = child
                if key.startswith('employee__'):
                    key = key[len('employee__'):]
                new_q.children.append((key, value))
            elif isinstance(child, Q):
                new_q.children.append(ScheduleEventViewSet._strip_employee_prefix(child))
            else:
                new_q.children.append(child)
        return new_q

    def _get_accessible_employee_ids(self, mode='write'):
        return set(
            self._get_accessible_employees_qs(mode=mode).values_list('id', flat=True)
        )

    def _validate_employee_accessible(self, employee, mode='write'):
        """PermissionDenied, если сотрудник недоступен в указанном режиме."""
        if employee is None:
            return
        if not self._get_accessible_employees_qs(mode=mode).filter(id=employee.id).exists():
            raise PermissionDenied('Сотрудник недоступен')

    def _validate_event_type(self, event_type):
        valid_types = {choice[0] for choice in ScheduleEvent.EVENT_TYPES}
        if event_type not in valid_types:
            raise ValidationError({
                'event_type': (
                    f"Недопустимый тип события '{event_type}'. "
                    f"Допустимые: {sorted(valid_types)}"
                )
            })

    # ------------------------------------------------------------------ #
    # Создание/обновление/удаление — с write-валидацией                  #
    # ------------------------------------------------------------------ #

    def perform_create(self, serializer):
        employee = serializer.validated_data.get('employee')
        self._validate_employee_accessible(employee, mode='write')
        try:
            serializer.save()
        except IntegrityError:
            raise ValidationError({
                'date': 'Событие на эту дату для данного сотрудника уже существует',
            })

    def perform_update(self, serializer):
        employee = serializer.validated_data.get('employee')
        self._validate_employee_accessible(employee, mode='write')
        try:
            serializer.save()
        except IntegrityError:
            raise ValidationError({
                'date': 'Событие на эту дату для данного сотрудника уже существует',
            })

    # ------------------------------------------------------------------ #
    # Actions                                                            #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'])
    def available_employees(self, request):
        """
        Список сотрудников, доступных пользователю для отображения в графике
        (read-область).
        """
        extra = {}
        division_id = request.query_params.get('division')
        subdivision_id = request.query_params.get('subdivision')
        if division_id:
            extra['division_id'] = division_id
        if subdivision_id:
            extra['subdivision_id'] = subdivision_id

        employees = (
            self._get_accessible_employees_qs(mode='read', extra_filters=extra or None)
            .order_by('priority', 'full_name')
        )
        serializer = EmployeeSerializer(
            employees, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_month(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        division_id = request.query_params.get('division')
        subdivision_id = request.query_params.get('subdivision')

        if not year or not month:
            return Response({'error': 'year and month are required'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            year = int(year)
            month = int(month)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid year or month'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not (1 <= month <= 12):
            return Response({'error': 'Month must be between 1 and 12'},
                            status=status.HTTP_400_BAD_REQUEST)

        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()

        # get_queryset() вернёт read-область (action='by_month' → не в WRITE_ACTIONS)
        events = self.get_queryset().filter(date__gte=start_date, date__lt=end_date)

        if division_id:
            events = events.filter(employee__division_id=division_id)
        if subdivision_id:
            events = events.filter(employee__subdivision_id=subdivision_id)

        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        employee_ids = request.data.get('employee_ids', [])
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        event_type = request.data.get('event_type')
        comment = request.data.get('comment', '') or ''

        if not employee_ids or not start_date or not end_date or not event_type:
            return Response(
                {'error': 'Missing required fields: employee_ids, start_date, end_date, event_type'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            self._validate_event_type(event_type)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        try:
            requested_ids = [int(x) for x in employee_ids]
        except (TypeError, ValueError):
            return Response({'error': 'Invalid employee_ids'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return Response({'error': 'Invalid date format, expected YYYY-MM-DD'},
                            status=status.HTTP_400_BAD_REQUEST)

        if start > end:
            return Response({'error': 'start_date must be <= end_date'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Массовое изменение — проверяем по write-области
        accessible_ids = self._get_accessible_employee_ids(mode='write')
        inaccessible = [eid for eid in requested_ids if eid not in accessible_ids]
        if inaccessible:
            return Response(
                {'error': 'Some employees are not accessible', 'employee_ids': inaccessible},
                status=status.HTTP_403_FORBIDDEN,
            )

        delta = timedelta(days=1)
        created = 0
        updated = 0
        current = start
        try:
            while current <= end:
                for emp_id in requested_ids:
                    _, created_flag = ScheduleEvent.objects.update_or_create(
                        employee_id=emp_id,
                        date=current,
                        defaults={'event_type': event_type, 'comment': comment},
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                current += delta
        except IntegrityError as e:
            logger.exception("bulk_update integrity error: %s", e)
            return Response({'error': 'Integrity error while updating events'},
                            status=status.HTTP_400_BAD_REQUEST)

        return Response({'created': created, 'updated': updated})
# employees/views.py
import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.db import IntegrityError, models
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
from users.mixins import RoleBasedFilterMixin
from users.permissions_config import ROLE_PERMISSIONS  # noqa: F401 (используется в проекте)

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
    """
    Базовый ViewSet с общей логикой для всех моделей.
    """

    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр."""
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
    """
    ViewSet для управления сотрудниками.
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
            employee_data = response.data
            log_user_action(
                user=request.user,
                action='create',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=employee_data.get('id'),
                object_name=employee_data.get('full_name'),
                details={'data': employee_data},
            )

        return response

    # Логирование обновления сотрудника
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data

        response = super().update(request, *args, **kwargs)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            new_data = response.data
            changed_fields = {}

            for key in old_data:
                if key in new_data and old_data[key] != new_data[key]:
                    changed_fields[key] = {
                        'old': old_data[key],
                        'new': new_data[key],
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
                    'new_data': new_data,
                },
            )

        return response

    # Логирование частичного обновления сотрудника
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = EmployeeSerializer(instance).data

        response = super().partial_update(request, *args, **kwargs)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            new_data = response.data
            changed_fields = {}

            for key in request.data:
                if key in old_data and old_data[key] != new_data.get(key):
                    changed_fields[key] = {
                        'old': old_data[key],
                        'new': new_data.get(key),
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
                    'request_data': request.data,
                },
            )

        return response

    # Логирование удаления сотрудника
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        employee_data = EmployeeSerializer(instance).data

        response = super().destroy(request, *args, **kwargs)

        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_user_action(
                user=request.user,
                action='delete',
                module='employees',
                request=request,
                model_name='Employee',
                object_id=instance.id,
                object_name=instance.full_name,
                details={'deleted_data': employee_data},
            )

        return response

    # Логирование просмотра деталей сотрудника
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        response = super().retrieve(request, *args, **kwargs)

        log_user_action(
            user=request.user,
            action='view',
            module='employees',
            request=request,
            model_name='Employee',
            object_id=instance.id,
            object_name=instance.full_name,
            details={'viewed_details': True},
        )

        return response

    # Логирование просмотра списка сотрудников
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # log_user_action(
        #     user=request.user,
        #     action='view',
        #     module='employees',
        #     request=request,
        #     model_name='Employee',
        #     details={
        #         'list_view': True,
        #         'filters': dict(request.query_params),
        #         'count': (
        #             response.data.get('count', len(response.data))
        #             if isinstance(response.data, dict)
        #             else len(response.data)
        #         ),
        #     },
        # )

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
    """
    ViewSet для управления ШаРаботниками.
    """
    queryset = ShaWorkerDetails.objects.all()
    serializer_class = ShaWorkerDetailsSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class ShaEquipmentConclusionViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления заключениями на технику.
    """
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class EmployeeDictionariesView(APIView):
    """
    View для получения справочников сотрудников.
    """
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
    """
    View для управления фотографиями сотрудников.
    """
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
            return Response(
                {'error': 'No photo provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            return Response(
                {'error': 'Failed to update photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                        'photo_url': None,
                    },
                    headers={
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                )

            return Response(
                {'error': 'No photo to delete'},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.exception("Failed to delete photo: %s", e)
            return Response(
                {'error': 'Failed to delete photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ScheduleEventViewSet(BaseViewSet):
    """
    ViewSet для управления событиями графика работы.
    Возвращает события только тех сотрудников, к которым у пользователя есть доступ
    (та же логика фильтрации, что и в EmployeeViewSet).
    """
    queryset = ScheduleEvent.objects.all()
    serializer_class = ScheduleEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    # ------------------------------------------------------------------ #
    # Вспомогательные методы                                             #
    # ------------------------------------------------------------------ #

    def _get_accessible_employees_qs(self):
        """
        Возвращает queryset сотрудников, доступных текущему пользователю,
        используя фильтрацию из EmployeeViewSet (RoleBasedFilterMixin).

        ВАЖНО: RoleBasedFilterMixin читает self.action, поэтому при ручном
        создании EmployeeViewSet мы обязаны явно задать action='list' —
        иначе получаем AttributeError.
        """
        from users.permissions import RoleBasedPermission as _RBP

        perm_checker = _RBP()
        if not perm_checker._check_permission(self.request.user, 'Employee', 'view'):
            return Employee.objects.none()

        emp_viewset = EmployeeViewSet()
        emp_viewset.request = self.request
        emp_viewset.kwargs = getattr(self, 'kwargs', {}) or {}
        emp_viewset.format_kwarg = getattr(self, 'format_kwarg', None)
        # КРИТИЧНО: RoleBasedFilterMixin использует self.action.
        emp_viewset.action = 'list'
        return emp_viewset.get_queryset()

    def _get_accessible_employee_ids(self):
        """Множество id сотрудников, доступных пользователю (для быстрых проверок)."""
        return set(
            self._get_accessible_employees_qs().values_list('id', flat=True)
        )

    def _validate_employee_accessible(self, employee):
        """Бросает PermissionDenied, если сотрудник недоступен."""
        if employee is None:
            return
        accessible = self._get_accessible_employees_qs()
        if not accessible.filter(id=employee.id).exists():
            raise PermissionDenied('Сотрудник недоступен')

    def _validate_event_type(self, event_type):
        """Проверяет, что event_type входит в допустимые choices модели."""
        valid_types = {choice[0] for choice in ScheduleEvent.EVENT_TYPES}
        if event_type not in valid_types:
            raise ValidationError({
                'event_type': (
                    f"Недопустимый тип события '{event_type}'. "
                    f"Допустимые: {sorted(valid_types)}"
                )
            })

    # ------------------------------------------------------------------ #
    # Queryset / permissions                                             #
    # ------------------------------------------------------------------ #

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ScheduleEvent.objects.none()

        accessible_employees = self._get_accessible_employees_qs()
        return ScheduleEvent.objects.filter(employee__in=accessible_employees)

    def perform_create(self, serializer):
        """Не позволяем создать событие для недоступного сотрудника."""
        employee = serializer.validated_data.get('employee')
        self._validate_employee_accessible(employee)
        try:
            serializer.save()
        except IntegrityError:
            raise ValidationError({
                'date': 'Событие на эту дату для данного сотрудника уже существует',
            })

    def perform_update(self, serializer):
        """Не позволяем перенести событие на недоступного сотрудника."""
        employee = serializer.validated_data.get('employee')
        self._validate_employee_accessible(employee)
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
    def by_month(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        division_id = request.query_params.get('division')
        subdivision_id = request.query_params.get('subdivision')

        if not year or not month:
            return Response(
                {'error': 'year and month are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            year = int(year)
            month = int(month)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid year or month'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (1 <= month <= 12):
            return Response(
                {'error': 'Month must be between 1 and 12'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()

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

        # --- Валидация входных данных ---
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
            return Response(
                {'error': 'Invalid employee_ids'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid date format, expected YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if start > end:
            return Response(
                {'error': 'start_date must be <= end_date'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Проверка доступности сотрудников ---
        accessible_ids = self._get_accessible_employee_ids()
        inaccessible = [eid for eid in requested_ids if eid not in accessible_ids]
        if inaccessible:
            return Response(
                {
                    'error': 'Some employees are not accessible',
                    'employee_ids': inaccessible,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- Само обновление ---
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
                        defaults={
                            'event_type': event_type,
                            'comment': comment,
                        },
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                current += delta
        except IntegrityError as e:
            logger.exception("bulk_update integrity error: %s", e)
            return Response(
                {'error': 'Integrity error while updating events'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'created': created,
            'updated': updated,
        })
"""
ViewSet для кандидатов.

Особенности:
  - Наследует RoleBasedFilterMixin + BaseViewSet — read/write-фильтры
    по ролям, запрет на изменения для view-only-ролей.
  - `stage_update` — inline-PATCH одного этапа.
  - `hire` — конвертация кандидата в Employee (минимальные поля).
  - `stats`, `dictionaries`, `export` — служебные GET-экшены.

Фильтрация по статусу:
  - По умолчанию (без query-параметра `status`) принятые (`hired`)
    кандидаты ИСКЛЮЧАЮТСЯ из выдачи — они уже стали сотрудниками.
  - Чтобы увидеть принятых, нужно явно передать `?status=hired`.
  - `?status=all` — показать вообще всех (включая принятых).
"""

import csv
import io
import logging

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from employees.models import Employee
from employees.serializers import EmployeeSerializer
from users.logging import log_user_action
from users.mixins import RoleBasedFilterMixin
from users.permissions import RoleBasedPermission

from .models import (
    Candidate, CandidateStage,
    CandidateStatus, Phase, StageType, StageStatus,
    STAGE_SEQUENCE, STAGE_TYPE_TO_PHASE,
)
from .serializers import (
    CandidateDetailSerializer,
    CandidateListSerializer,
    CandidateStageSerializer,
    CandidateWriteSerializer,
    HireSerializer,
)

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    """Проверка view-only роли для изменяющих действий."""

    def check_view_only_restrictions(self):
        if RoleBasedPermission.is_view_only_user(self.request.user):
            if self.action in ['create', 'update', 'partial_update', 'destroy']:
                raise ValidationError(
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


class CandidateViewSet(RoleBasedFilterMixin, BaseViewSet):
    queryset = (
        Candidate.objects
        .select_related('curator', 'curator__division', 'division', 'hired_employee')
        .prefetch_related('stages')
    )
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['number', 'full_name', 'division__name', 'created_at', 'status']
    ordering = ['number']
    search_fields = ['full_name', 'planned_position', 'phone']

    # ------------------------------------------------------------------ #
    # Queryset с query-param-фильтрами                                    #
    # ------------------------------------------------------------------ #

    def get_queryset(self):
        qs = super().get_queryset()

        status_param = self.request.query_params.get('status')

        if status_param == 'all':
            # Явный запрос «показать всех, включая принятых» — не фильтруем.
            pass
        elif status_param:
            # Явный фильтр по конкретному статусу.
            qs = qs.filter(status=status_param)
        else:
            # По умолчанию скрываем принятых — они уже стали сотрудниками.
            qs = qs.exclude(status=CandidateStatus.HIRED)

        division_param = self.request.query_params.get('division')
        if division_param:
            try:
                qs = qs.filter(division_id=int(division_param))
            except (TypeError, ValueError):
                pass

        curator_param = self.request.query_params.get('curator')
        if curator_param:
            try:
                qs = qs.filter(curator_id=int(curator_param))
            except (TypeError, ValueError):
                pass

        return qs

    # ------------------------------------------------------------------ #
    # Выбор сериализатора                                                 #
    # ------------------------------------------------------------------ #

    def get_serializer_class(self):
        if self.action == 'list':
            return CandidateListSerializer
        if self.action == 'hire':
            return HireSerializer
        return CandidateDetailSerializer

    # ------------------------------------------------------------------ #
    # CRUD + логирование                                                  #
    # ------------------------------------------------------------------ #

    def create(self, request, *args, **kwargs):
        write = CandidateWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        instance = write.save()

        log_user_action(
            user=request.user, action='create', module='candidates',
            request=request, model_name='Candidate',
            object_id=instance.pk, object_name=instance.full_name,
            details={'data': {'number': instance.number, 'full_name': instance.full_name}},
        )
        return self._detail_response(instance, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_data = CandidateDetailSerializer(instance, context={'request': request}).data

        write = CandidateWriteSerializer(instance, data=request.data, partial=partial)
        write.is_valid(raise_exception=True)
        instance = write.save()

        new_data = CandidateDetailSerializer(instance, context={'request': request}).data
        changed = {
            k: {'old': old_data.get(k), 'new': new_data.get(k)}
            for k in new_data
            if k in old_data and old_data[k] != new_data[k]
        }
        log_user_action(
            user=request.user, action='update', module='candidates',
            request=request, model_name='Candidate',
            object_id=instance.pk, object_name=instance.full_name,
            details={'changed_fields': changed},
        )
        return self._detail_response(instance, status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        snapshot = CandidateDetailSerializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_user_action(
                user=request.user, action='delete', module='candidates',
                request=request, model_name='Candidate',
                object_id=instance.pk, object_name=instance.full_name,
                details={'deleted_data': snapshot},
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_user_action(
            user=request.user, action='view', module='candidates',
            request=request, model_name='Candidate',
            object_id=instance.pk, object_name=instance.full_name,
            details={'viewed_details': True},
        )
        return response

    def _detail_response(self, instance, status_code):
        """Отдаём полный detail-объект после create/update."""
        data = CandidateDetailSerializer(instance, context={'request': self.request}).data
        headers = self.get_success_headers(data) if status_code == status.HTTP_201_CREATED else {}
        return Response(data, status=status_code, headers=headers)

    # ------------------------------------------------------------------ #
    # Inline-редактирование этапа                                         #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['patch'],
            url_path=r'stages/(?P<stage_id>\d+)')
    def stage_update(self, request, pk=None, stage_id=None):
        candidate = self.get_object()
        stage = get_object_or_404(CandidateStage, pk=stage_id, candidate=candidate)
        serializer = CandidateStageSerializer(stage, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        log_user_action(
            user=request.user, action='update', module='candidates',
            request=request, model_name='CandidateStage',
            object_id=stage.pk,
            object_name=f'{candidate.full_name} — {stage.get_stage_type_display()}',
            details={'candidate_id': candidate.pk, 'request_data': dict(request.data)},
        )
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    # Hire — конвертация кандидата в сотрудника                           #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['post'])
    def hire(self, request, pk=None):
        candidate = self.get_object()

        if candidate.status == CandidateStatus.HIRED:
            raise ValidationError({'detail': 'Кандидат уже принят'})
        if candidate.hired_employee_id:
            raise ValidationError({'detail': 'Кандидат уже связан с сотрудником'})

        serializer = HireSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target_division = data.get('division') or candidate.division

        with transaction.atomic():
            employee = Employee.objects.create(
                full_name=candidate.full_name,
                position=candidate.planned_position,
                personal_phone=candidate.phone or None,
                division=target_division,
                category=data.get('category', 'civilian'),
            )
            candidate.status = CandidateStatus.HIRED
            candidate.hired_employee = employee
            candidate.save(update_fields=['status', 'hired_employee', 'updated_at'])

        log_user_action(
            user=request.user, action='create', module='employees',
            request=request, model_name='Employee',
            object_id=employee.pk, object_name=employee.full_name,
            details={
                'from_candidate': candidate.pk,
                'candidate_number': candidate.number,
                'category': data.get('category'),
                'division_id': target_division.id if target_division else None,
            },
        )

        return Response(
            EmployeeSerializer(employee, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------ #
    # Служебные GET-экшены                                                #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Агрегаты для дашборда (с учётом ролевых фильтров и query-params)."""
        qs = self.filter_queryset(self.get_queryset())

        total = qs.count()
        by_status = {
            s: qs.filter(status=s).count()
            for s in (CandidateStatus.ACTIVE, CandidateStatus.HIRED,
                      CandidateStatus.REJECTED, CandidateStatus.ARCHIVED)
        }
        overdue_count = sum(
            1 for c in qs.prefetch_related('stages')
            for s in c.stages.all() if s.is_overdue
        )

        return Response({
            'total': total,
            'by_status': by_status,
            'overdue_count': overdue_count,
        })

    @action(detail=False, methods=['get'])
    def dictionaries(self, request):
        """Справочники этапов, фаз и статусов — для UI."""
        return Response({
            'statuses': [
                {'value': v, 'label': l} for v, l in CandidateStatus.choices
            ],
            'stage_statuses': [
                {'value': v, 'label': l} for v, l in StageStatus.choices
            ],
            'phases': [
                {'value': v, 'label': l} for v, l in Phase.choices
            ],
            'stages': [
                {
                    'value': st,
                    'label': StageType(st).label,
                    'phase': ph,
                    'order': order,
                }
                for st, ph, order in STAGE_SEQUENCE
            ],
        })

    # ------------------------------------------------------------------ #
    # Экспорт CSV / XLSX                                                  #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'])
    def export(self, request):
        fmt = (request.query_params.get('fmt') or 'csv').lower()
        if fmt not in ('csv', 'xlsx'):
            raise ValidationError({'fmt': 'Допустимо: csv, xlsx'})

        qs = self.filter_queryset(self.get_queryset())

        base_headers = [
            '№', 'ФИО', 'Планируемая должность', 'Телефон',
            'Закреплённый сотрудник', 'Подразделение', 'Статус',
        ]
        stage_headers = [StageType(st).label for st, _, _ in STAGE_SEQUENCE]
        headers = base_headers + stage_headers

        rows = []
        for c in qs:
            stage_map = {s.stage_type: s for s in c.stages.all()}
            row = [
                c.number,
                c.full_name,
                c.planned_position,
                c.phone or '',
                c.curator.full_name if c.curator else (c.custom_curator_name or ''),
                c.division.name if c.division else (c.custom_division_name or ''),
                c.get_status_display(),
            ]
            for st, _, _ in STAGE_SEQUENCE:
                s = stage_map.get(st)
                if not s:
                    row.append('')
                    continue
                cell = ''
                if s.planned_date:
                    cell = s.planned_date.strftime('%d-%m-%Y')
                if s.status == StageStatus.DONE and s.actual_date:
                    cell = f'{cell} ✓ {s.actual_date.strftime("%d-%m-%Y")}'.strip()
                elif s.is_overdue:
                    cell = f'{cell} (просрочен)'.strip()
                elif s.status == StageStatus.SKIPPED:
                    cell = f'{cell} (пропущен)'.strip()
                row.append(cell)
            rows.append(row)

        log_user_action(
            user=request.user, action='export', module='candidates',
            request=request, model_name='Candidate',
            object_id=None, object_name=None,
            details={
                'format': fmt,
                'count': len(rows),
                'filters': {
                    'status': request.query_params.get('status'),
                    'division': request.query_params.get('division'),
                    'curator': request.query_params.get('curator'),
                    'search': request.query_params.get('search'),
                },
            },
        )

        if fmt == 'xlsx':
            return self._export_xlsx(headers, rows)
        return self._export_csv(headers, rows)

    @staticmethod
    def _export_csv(headers, rows) -> HttpResponse:
        buffer = io.StringIO()
        buffer.write('\ufeff')  # BOM — Excel корректно открывает UTF-8
        writer = csv.writer(buffer, delimiter=';')
        writer.writerow(headers)
        writer.writerows(rows)
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="candidates.csv"'
        return response

    @staticmethod
    def _export_xlsx(headers, rows) -> HttpResponse:
        try:
            from openpyxl import Workbook
            from openpyxl.utils import get_column_letter
        except ImportError:
            raise ValidationError({
                'format': 'openpyxl не установлен на сервере',
            })

        wb = Workbook()
        ws = wb.active
        ws.title = 'Кандидаты'
        ws.append(headers)
        for row in rows:
            ws.append(row)

        for col_idx, header in enumerate(headers, start=1):
            max_len = len(str(header))
            for row in rows:
                if col_idx - 1 < len(row):
                    max_len = max(max_len, len(str(row[col_idx - 1])))
            ws.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 2, 40)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            buffer.read(),
            content_type=(
                'application/vnd.openxmlformats-officedocument'
                '.spreadsheetml.sheet'
            ),
        )
        response['Content-Disposition'] = 'attachment; filename="candidates.xlsx"'
        return response
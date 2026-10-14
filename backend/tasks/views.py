from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from facilities.models import Division, Subdivision
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskStepSerializer
from employees.models import Employee
from users.mixins import RoleBasedFilterMixin
from users.permissions_config import ROLE_PERMISSIONS
from users.logging.tasks import (
    log_task_create, log_task_update, log_task_delete, log_task_view,
    log_taskstep_create, log_taskstep_update, log_taskstep_delete,
    log_taskstep_view, log_taskstep_complete,
)
import logging

logger = logging.getLogger(__name__)


class TaskViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return queryset.prefetch_related('steps').select_related(
                'division', 'subdivision', 'created_by', 'assignee'
            )

        if self._can_see_all_divisions():
            division_id = self.request.query_params.get('division')
            if division_id:
                queryset = queryset.filter(division_id=division_id)

            subdivision_id = self.request.query_params.get('subdivision')
            if subdivision_id:
                queryset = queryset.filter(subdivision_id=subdivision_id)

        show_completed = self.request.query_params.get('show_completed')
        show_only_mine = self.request.query_params.get('show_only_mine', '').lower() == 'true'
        user = self.request.user

        if show_only_mine:
            queryset = queryset.filter(is_private=True, created_by=user)
        else:
            queryset = queryset.filter(is_private=False)

        if show_completed is not None:
            show_completed = show_completed.lower() == 'true'
            queryset = queryset.annotate(
                incomplete_steps=Count('steps', filter=Q(steps__is_completed=False))
            )
            if show_completed:
                queryset = queryset.filter(incomplete_steps=0)
            else:
                queryset = queryset.filter(incomplete_steps__gt=0)

        return queryset.prefetch_related('steps').select_related(
            'division', 'subdivision', 'created_by', 'assignee'
        )

    # ------------------------------------------------------------------ #
    # available-divisions                                                 #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='available-divisions')
    def available_divisions(self, request):
        user = request.user
        mixin = RoleBasedFilterMixin()
        mixin.request = request

        filters = mixin._get_role_filters('Task')

        if 'division_id' in filters:
            division = Division.objects.filter(id=filters['division_id']).first()
            if division:
                if 'subdivision_id' in filters:
                    subdivisions = Subdivision.objects.filter(id=filters['subdivision_id'])
                else:
                    subdivisions = division.subdivisions.all()
                return Response({
                    'divisions': [{'id': division.id, 'name': division.name}],
                    'subdivisions': [
                        {'id': s.id, 'name': s.name, 'division_id': division.id}
                        for s in subdivisions
                    ],
                })
            return Response({'divisions': [], 'subdivisions': []})

        user_roles = mixin._get_user_roles()
        can_see_all = any(
            ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
            for role in user_roles
        )

        if can_see_all:
            divisions = Division.objects.all()
            return Response({
                'divisions': [{'id': d.id, 'name': d.name} for d in divisions],
                'subdivisions': [
                    {'id': s.id, 'name': s.name, 'division_id': s.division_id}
                    for s in Subdivision.objects.all()
                ],
            })

        division = user.division
        if division:
            return Response({
                'divisions': [{'id': division.id, 'name': division.name}],
                'subdivisions': [
                    {'id': s.id, 'name': s.name, 'division_id': division.id}
                    for s in division.subdivisions.all()
                ],
            })

        return Response({'divisions': [], 'subdivisions': []})

    # ------------------------------------------------------------------ #
    # available-assignees — теперь по Employee                            #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'], url_path='available-assignees')
    def available_assignees(self, request):
        """
        Возвращает список СОТРУДНИКОВ (Employee), доступных для назначения
        ответственным исполнителем.

        Фильтры:
          - division (обязательно имеет смысл передавать) — ID подразделения;
          - subdivision (опционально) — ID отделения.

        Сортировка — как у Employee.Meta.ordering (priority, full_name),
        то есть руководители выше, гражданские ниже.
        """
        division_id = request.query_params.get('division')
        subdivision_id = request.query_params.get('subdivision')

        queryset = Employee.objects.all()

        if division_id:
            try:
                queryset = queryset.filter(division_id=int(division_id))
            except (TypeError, ValueError):
                return Response(
                    {'error': 'Invalid division id'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if subdivision_id:
            try:
                queryset = queryset.filter(subdivision_id=int(subdivision_id))
            except (TypeError, ValueError):
                return Response(
                    {'error': 'Invalid subdivision id'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        queryset = queryset.order_by('priority', 'full_name')

        data = [
            {
                'id': emp.id,
                'full_name': emp.full_name,
                'position': emp.position or '',
                'rank': emp.rank or '',
                'division_id': emp.division_id,
                'subdivision_id': emp.subdivision_id,
            }
            for emp in queryset
        ]

        return Response(data)

    # ------------------------------------------------------------------ #
    # CRUD + логирование                                                  #
    # ------------------------------------------------------------------ #

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {
                    'old': old_data[key],
                    'new': new_data[key],
                }
        return changed

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating task with data: {request.data}")
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = Task.objects.get(id=response.data['id'])
            log_task_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data},
            )
        return response

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_task_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)},
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        task_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_task_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': task_data},
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_task_view(
            user=request.user,
            instance=instance,
            request=request,
        )
        return response

    # ------------------------------------------------------------------ #
    # Доп. эндпоинты                                                      #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'])
    def incomplete_count(self, request):
        subdivision_id = request.query_params.get('subdivision')
        division_id = request.query_params.get('division')

        queryset = Task.objects.filter(is_private=False)

        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)

        queryset = queryset.annotate(
            incomplete_steps=Count('steps', filter=Q(steps__is_completed=False))
        ).filter(incomplete_steps__gt=0)

        return Response({'count': queryset.count()})

    def perform_update(self, serializer):
        serializer.save()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        task = self.get_object()
        return Response({'progress': task.progress})


class TaskStepViewSet(viewsets.ModelViewSet):
    queryset = TaskStep.objects.all()
    serializer_class = TaskStepSerializer
    permission_classes = [IsAuthenticated]

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_taskstep_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data},
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_taskstep_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)},
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        step_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_taskstep_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': step_data},
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_taskstep_view(
            user=request.user,
            instance=instance,
            request=request,
        )
        return response

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        step = self.get_object()
        old_value = step.is_completed
        step.is_completed = True
        step.completed_by = request.user
        step.completed_at = timezone.now()
        step.save()
        step.refresh_from_db()
        log_taskstep_complete(
            user=request.user,
            instance=step,
            old_value=old_value,
            new_value=True,
            request=request,
        )
        return Response(TaskStepSerializer(step).data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        step = self.get_object()
        old_value = step.is_completed
        step.is_completed = False
        step.completed_by = None
        step.completed_at = None
        step.save()
        step.refresh_from_db()
        log_taskstep_complete(
            user=request.user,
            instance=step,
            old_value=old_value,
            new_value=False,
            request=request,
        )
        return Response(TaskStepSerializer(step).data)
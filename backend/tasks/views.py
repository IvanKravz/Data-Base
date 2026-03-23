from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from facilities.models import Division, Subdivision
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskStepSerializer
from users.mixins import RoleBasedFilterMixin
from users.permissions_config import ROLE_PERMISSIONS
from users.logging.tasks import (
    log_task_create, log_task_update, log_task_delete, log_task_view,
    log_taskstep_create, log_taskstep_update, log_taskstep_delete,
    log_taskstep_view, log_taskstep_complete
)
import logging

logger = logging.getLogger(__name__)


class TaskViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Применяем фильтры из миксина (ролевые фильтры)
        queryset = super().get_queryset()

        # Если действие — получение конкретного объекта, не применяем дополнительные фильтры
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return queryset.prefetch_related('steps')

        # Дополнительные фильтры из query параметров
        division_id = self.request.query_params.get('division')
        subdivision_id = self.request.query_params.get('subdivision')
        show_completed = self.request.query_params.get('show_completed')
        show_only_mine = self.request.query_params.get('show_only_mine', '').lower() == 'true'
        user = self.request.user

        # Логика приватности (оставляем как есть)
        if show_only_mine:
            queryset = queryset.filter(is_private=True, created_by=user)
        else:
            queryset = queryset.filter(is_private=False)

        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)

        if show_completed is not None:
            show_completed = show_completed.lower() == 'true'
            queryset = queryset.annotate(
                incomplete_steps=Count('steps', filter=Q(steps__is_completed=False)))
            if show_completed:
                queryset = queryset.filter(incomplete_steps=0)
            else:
                queryset = queryset.filter(incomplete_steps__gt=0)

        return queryset.prefetch_related('steps')
    
    @action(detail=False, methods=['get'], url_path='available-divisions')
    def available_divisions(self, request):
        """Возвращает подразделения и отделения, доступные пользователю для создания задач."""
        user = request.user
        mixin = RoleBasedFilterMixin()
        mixin.request = request

        # Получаем фильтры для модели Task из ролей пользователя
        filters = mixin._get_role_filters('Task')
        
        # Если есть фильтр по division_id, ограничиваем этим подразделением
        if 'division_id' in filters:
            division = Division.objects.filter(id=filters['division_id']).first()
            if division:
                # Если есть фильтр по subdivision_id, возвращаем только это отделение
                if 'subdivision_id' in filters:
                    subdivisions = Subdivision.objects.filter(id=filters['subdivision_id'])
                else:
                    subdivisions = division.subdivisions.all()
                return Response({
                    'divisions': [{'id': division.id, 'name': division.name}],
                    'subdivisions': [
                        {'id': s.id, 'name': s.name, 'division_id': division.id}
                        for s in subdivisions
                    ]
                })
            else:
                return Response({'divisions': [], 'subdivisions': []})

        # Если нет фильтра по division_id, проверяем, может ли пользователь видеть все подразделения
        user_roles = mixin._get_user_roles()
        can_see_all = any(
            ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
            for role in user_roles
        )

        if can_see_all:
            # Пользователь может видеть все подразделения
            divisions = Division.objects.all()
            return Response({
                'divisions': [{'id': d.id, 'name': d.name} for d in divisions],
                'subdivisions': [
                    {'id': s.id, 'name': s.name, 'division_id': s.division_id}
                    for s in Subdivision.objects.all()
                ]
            })

        # В противном случае – только подразделение пользователя
        division = user.division
        if division:
            return Response({
                'divisions': [{'id': division.id, 'name': division.name}],
                'subdivisions': [
                    {'id': s.id, 'name': s.name, 'division_id': division.id}
                    for s in division.subdivisions.all()
                ]
            })

        # Если ничего не подошло – пустой список
        return Response({'divisions': [], 'subdivisions': []})

    def _get_changed_fields(self, old_data, new_data):
        """Определяет изменённые поля между старыми и новыми данными"""
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {
                    'old': old_data[key],
                    'new': new_data[key]
                }
        return changed

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating task with data: {request.data}")
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            # Получаем созданный объект напрямую из модели (игнорируем фильтры queryset)
            instance = Task.objects.get(id=response.data['id'])
            log_task_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # Разрешаем частичное обновление
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_task_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
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
                details={'deleted_data': task_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_task_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response

    @action(detail=False, methods=['get'])
    def incomplete_count(self, request):
        subdivision_id = request.query_params.get('subdivision')
        division_id = request.query_params.get('division')
        
        # Фильтруем только публичные незавершенные задачи
        queryset = Task.objects.filter(is_private=False)
        
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)
        
        # Аннотируем количество незавершенных шагов
        queryset = queryset.annotate(
            incomplete_steps=Count('steps', filter=Q(steps__is_completed=False))
        ).filter(incomplete_steps__gt=0)
        
        count = queryset.count()
        return Response({'count': count})

    def perform_update(self, serializer):
        # Проверяем, что пользователь может изменять подразделение
        instance = self.get_object()
        division = serializer.validated_data.get('division', instance.division)
        # Здесь можно добавить дополнительную проверку прав
        serializer.save()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        task = self.get_object()
        # Не логируем как просмотр, так как это кастомное действие
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
                details={'data': response.data}
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
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
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
                details={'deleted_data': step_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_taskstep_view(
            user=request.user,
            instance=instance,
            request=request
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
            request=request
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
            request=request
        )
        return Response(TaskStepSerializer(step).data)
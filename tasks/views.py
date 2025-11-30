from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, F
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskStepSerializer
from users.models import User
import logging

logger = logging.getLogger(__name__)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        division_id = self.request.query_params.get('division')
        subdivision_id = self.request.query_params.get('subdivision')
        show_completed = self.request.query_params.get('show_completed')
        
        show_only_mine = self.request.query_params.get('show_only_mine', '').lower() == 'true'
        user = self.request.user
        
        if show_only_mine:
            print("Filtering private tasks for current user")  # Лог фильтрации
            queryset = queryset.filter(is_private=True, created_by=user)
        else:
            print("Filtering public tasks")  # Лог фильтрации
            queryset = queryset.filter(is_private=False)
        
        # Общие фильтры
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)
        
        # Фильтрация по завершенности
        if show_completed is not None:
            show_completed = show_completed.lower() == 'true'
            queryset = queryset.annotate(
                incomplete_steps=Count('steps', filter=Q(steps__is_completed=False)))
            if show_completed:
                queryset = queryset.filter(incomplete_steps=0)
            else:
                queryset = queryset.filter(incomplete_steps__gt=0)

        return queryset.prefetch_related('steps')
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Creating task with data: {request.data}")
        return super().create(request, *args, **kwargs)
    
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
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # Разрешаем частичное обновление
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

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
        return Response({'progress': task.progress})
    

class TaskStepViewSet(viewsets.ModelViewSet):
    queryset = TaskStep.objects.all()
    serializer_class = TaskStepSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        step = self.get_object()
        step.is_completed = True
        step.completed_by = request.user
        step.completed_at = timezone.now()
        step.save()
        
        # Перезагружаем объект с связанными данными
        step.refresh_from_db()
        return Response(TaskStepSerializer(step).data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        step = self.get_object()
        step.is_completed = False
        step.completed_by = None
        step.completed_at = None
        step.save()
        
        # Перезагружаем объект
        step.refresh_from_db()
        return Response(TaskStepSerializer(step).data)
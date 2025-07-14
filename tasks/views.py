from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, F
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskStepSerializer
from users.models import User

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        division_id = self.request.query_params.get('division')
        subdivision_id = self.request.query_params.get('subdivision')
        show_completed = self.request.query_params.get('show_completed')

        # Базовые фильтры
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)

        # Фильтрация по завершенности только если явно указан параметр
        if show_completed is not None:
            show_completed = show_completed.lower() == 'true'
            queryset = queryset.annotate(
                incomplete_steps=Count('steps', filter=Q(steps__is_completed=False)))
            if show_completed:
                queryset = queryset.filter(incomplete_steps=0)
            else:
                queryset = queryset.filter(incomplete_steps__gt=0)

        return queryset.prefetch_related('steps')

    def perform_update(self, serializer):
        # Проверяем, что пользователь может изменять подразделение
        instance = self.get_object()
        division = serializer.validated_data.get('division', instance.division)
        
        # Здесь можно добавить дополнительную проверку прав
        serializer.save()

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        task = self.get_object()
        return Response({'progress': task.progress})
    
    @action(detail=False, methods=['get'])
    def incomplete_count(self, request):
        subdivision_id = request.query_params.get('subdivision')
        division_id = request.query_params.get('division')
        
        count = Task.get_incomplete_count(
            division_id=division_id,
            subdivision_id=subdivision_id
        )
        return Response({'count': count})

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
        return Response(self.get_serializer(step).data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        step = self.get_object()
        step.is_completed = False
        step.completed_by = None
        step.completed_at = None
        step.save()
        return Response(self.get_serializer(step).data)
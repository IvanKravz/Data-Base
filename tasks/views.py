from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
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
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(steps__name__icontains=search) |
                Q(steps__comments__icontains=search)
            ).distinct()
            
        return queryset.prefetch_related('steps')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

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
        return Response(self.get_serializer(step).data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        step = self.get_object()
        step.is_completed = False
        step.completed_by = None
        step.completed_at = None
        step.save()
        return Response(self.get_serializer(step).data)
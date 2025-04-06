from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskStepSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.all()
        division = self.request.query_params.get('division', None)
        category = self.request.query_params.get('category', None)
        completed = self.request.query_params.get('completed', None)
        search = self.request.query_params.get('search', None)

        if division:
            queryset = queryset.filter(division=division)
        if category:
            queryset = queryset.filter(category=category)
        if completed is not None:
            if completed.lower() == 'true':
                queryset = queryset.filter(steps__is_completed=True).distinct()
            else:
                queryset = queryset.exclude(steps__is_completed=True).distinct()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(steps__name__icontains=search) |
                Q(steps__comments__icontains=search)
            ).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        division = request.query_params.get('division')

        queryset = self.get_queryset()
        if division:
            queryset = queryset.filter(division=division)
        if start_date and end_date:
            queryset = queryset.filter(
                Q(steps__start_date__range=[start_date, end_date]) |
                Q(steps__end_date__range=[start_date, end_date])
            ).distinct()

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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
        serializer = self.get_serializer(step)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        step = self.get_object()
        step.is_completed = False
        step.completed_by = None
        step.completed_at = None
        step.save()
        serializer = self.get_serializer(step)
        return Response(serializer.data)
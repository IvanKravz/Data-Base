from django.db import models
from django.utils import timezone
from facilities.models import Division, Subdivision
from users.models import User

class Task(models.Model):
    TASK_CATEGORIES = [
        ('urgent', 'Срочно'),
        ('planned', 'Плановая'),
        ('attention', 'Обратить внимание')
    ]

    title = models.CharField(max_length=255, verbose_name='Название')
    category = models.CharField(max_length=20, choices=TASK_CATEGORIES, verbose_name='Категория')
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='tasks', verbose_name='Подразделение')
    subdivision = models.ForeignKey(Subdivision, on_delete=models.CASCADE, null=True, related_name='tasks', verbose_name='Отделение')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks', verbose_name='Создал')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['-created_at']

class TaskStep(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='steps', verbose_name='Задача')
    name = models.CharField(max_length=255, verbose_name='Название')
    comments = models.TextField(blank=True, verbose_name='Комментарии')
    start_date = models.DateTimeField(verbose_name='Дата начала')
    end_date = models.DateTimeField(verbose_name='Дата окончания')
    is_completed = models.BooleanField(default=False, verbose_name='Выполнено')
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='completed_steps', verbose_name='Выполнил')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата выполнения')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.task.title} - {self.name}"

    class Meta:
        verbose_name = 'Этап задачи'
        verbose_name_plural = 'Этапы задач'
        ordering = ['start_date']

from rest_framework import serializers
from .models import Task, TaskStep
from users.serializers import UserSerializer

class TaskStepSerializer(serializers.ModelSerializer):
    completed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskStep
        fields = [
            'id', 'name', 'comments', 'start_date', 'end_date',
            'is_completed', 'completed_by', 'completed_at',
            'created_at', 'updated_at'
        ]

class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'division', 'division_name', 'created_by',
            'steps', 'progress', 'created_at', 'updated_at'
        ]

    def get_progress(self, obj):
        total_steps = obj.steps.count()
        if not total_steps:
            return 0
        completed_steps = obj.steps.filter(is_completed=True).count()
        return (completed_steps / total_steps) * 100
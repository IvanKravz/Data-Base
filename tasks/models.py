from django.db import models
from django.utils import timezone
from facilities.models import Division, Subdivision
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()

class Task(models.Model):
    URGENT = 'urgent'
    PLANNED = 'planned'
    ATTENTION = 'attention'
    
    TASK_CATEGORIES = [
        (URGENT, 'Срочно'),
        (PLANNED, 'Плановая'),
        (ATTENTION, 'Обратить внимание')
    ]

    title = models.CharField(max_length=255, verbose_name='Название')
    category = models.CharField(
        max_length=20, 
        choices=TASK_CATEGORIES, 
        verbose_name='Категория'
    )
    division = models.ForeignKey(
        Division, 
        on_delete=models.CASCADE, 
        related_name='tasks',
        verbose_name='Подразделение'
    )
    subdivision = models.ForeignKey(
        Subdivision, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='tasks',
        verbose_name='Отделение'
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_tasks',
        verbose_name='Создатель'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['-created_at']

    @property
    def progress(self):
        total_steps = self.steps.count()
        if total_steps == 0:
            return 0
        completed_steps = self.steps.filter(is_completed=True).count()
        return int((completed_steps / total_steps) * 100)
    
    @property
    def is_completed(self):
        return self.progress == 100

    @classmethod
    def get_incomplete_count(cls, division_id=None, subdivision_id=None):
        """
        Возвращает количество задач с незавершёнными шагами
        с возможностью фильтрации по division и subdivision
        """
        # Фильтр для задач, где есть хотя бы один незавершённый шаг
        queryset = cls.objects.filter(
            steps__is_completed=False
        ).distinct()
        
        # Применяем фильтры
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)
            
        return queryset.count()

class TaskStep(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='steps',
        verbose_name='Задача'
    )
    name = models.CharField(max_length=255, verbose_name='Название')
    comments = models.TextField(blank=True, verbose_name='Комментарии')
    start_date = models.DateTimeField(verbose_name='Дата начала')
    end_date = models.DateTimeField(verbose_name='Дата окончания')
    is_completed = models.BooleanField(default=False, verbose_name='Выполнено')
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_steps',
        verbose_name='Выполнил'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата выполнения'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.task.title} - {self.name}"

    class Meta:
        verbose_name = 'Этап задачи'
        verbose_name_plural = 'Этапы задач'
        ordering = ['start_date']
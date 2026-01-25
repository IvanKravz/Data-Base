# logs_models.py
from django.db import models
from django.utils import timezone

class UserActionLog(models.Model):
    """Модель для логирования действий пользователя"""
    ACTION_CHOICES = [
        ('login', 'Вход в систему'),
        ('logout', 'Выход из системы'),
        ('create', 'Создание'),
        ('update', 'Изменение'),
        ('delete', 'Удаление'),
        ('view', 'Просмотр'),
        ('download', 'Скачивание'),
        ('upload', 'Загрузка'),
        ('export', 'Экспорт'),
        ('import', 'Импорт'),
        ('approve', 'Утверждение'),
        ('reject', 'Отклонение'),
        ('move', 'Перемещение'),
        ('copy', 'Копирование'),
        ('archive', 'Архивирование'),
        ('restore', 'Восстановление'),
    ]
    
    MODULE_CHOICES = [
        ('employees', 'Сотрудники'),
        ('equipment', 'Оборудование'),
        ('facilities', 'Объекты'),
        ('tasks', 'Задачи'),
        ('networks', 'Сети связи'),
        ('users', 'Пользователи'),
        ('divisions', 'Подразделения'),
        ('subdivisions', 'Отделения'),
        ('auth', 'Аутентификация'),
        ('system', 'Система'),
        ('storage', 'Хранилище'),
        ('sha_workers', 'ШаРаботники'),
        ('sha_equipment', 'ШаОборудование'),
        ('reports', 'Отчеты'),
        ('settings', 'Настройки'),
    ]
    
    user = models.ForeignKey(
        'users.User',  # Изменено на строковую ссылку
        on_delete=models.CASCADE,
        related_name='action_logs',
        verbose_name='Пользователь'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name='Действие'
    )
    module = models.CharField(
        max_length=20,
        choices=MODULE_CHOICES,
        verbose_name='Модуль'
    )
    model_name = models.CharField(
        max_length=100,
        verbose_name='Модель',
        null=True,
        blank=True
    )
    object_id = models.CharField(
        max_length=100,
        verbose_name='ID объекта',
        null=True,
        blank=True
    )
    object_name = models.CharField(
        max_length=255,
        verbose_name='Название объекта',
        null=True,
        blank=True
    )
    details = models.JSONField(
        verbose_name='Детали действия',
        default=dict,
        null=True,
        blank=True
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='IP адрес',
        null=True,
        blank=True
    )
    user_agent = models.TextField(
        verbose_name='User Agent',
        null=True,
        blank=True
    )
    file_path = models.CharField(
        max_length=500,
        verbose_name='Путь к файлу',
        null=True,
        blank=True
    )
    file_size = models.BigIntegerField(
        verbose_name='Размер файла',
        null=True,
        blank=True
    )
    file_type = models.CharField(
        max_length=100,
        verbose_name='Тип файла',
        null=True,
        blank=True
    )
    storage_location = models.CharField(
        max_length=200,
        verbose_name='Место хранения',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Дата и время'
    )
    
    class Meta:
        verbose_name = 'Лог действий пользователя'
        verbose_name_plural = 'Логи действий пользователей'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['module', 'created_at']),
            models.Index(fields=['storage_location']),
            models.Index(fields=['file_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} - {self.get_module_display()} - {self.created_at}"
    
    def get_action_color(self):
        """Возвращает цвет для действия"""
        color_map = {
            'create': 'green',
            'update': 'blue',
            'delete': 'red',
            'view': 'gray',
            'login': 'teal',
            'logout': 'orange',
            'upload': 'purple',
            'download': 'indigo',
            'move': 'yellow',
            'copy': 'pink',
            'archive': 'amber',
            'restore': 'lime',
        }
        return color_map.get(self.action, 'gray')
    
    def get_file_size_display(self):
        """Форматирует размер файла для отображения"""
        file_size = self.file_size
        if not file_size:
            return "0 Б"
        
        for unit in ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']:
            if file_size < 1024:
                return f"{file_size:.2f} {unit}"
            file_size /= 1024
        return f"{file_size:.2f} ПБ"
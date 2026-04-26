# models.py
from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import User, Division, Subdivision

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def deleted(self):
        return super().get_queryset().filter(is_deleted=True)
    
    def all_objects(self):
        """Возвращает все объекты без фильтрации по is_deleted"""
        return super().get_queryset()


class SoftDeleteMixin(models.Model):
    """Миксин для мягкого удаления"""
    is_deleted = models.BooleanField(default=False, verbose_name='Удалено')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата удаления')
    deleted_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='deleted_%(class)s_set',
        verbose_name='Удалил'
    )
    
    objects = SoftDeleteManager()
    
    class Meta:
        abstract = True
    
    def soft_delete(self, user=None):
        """Мягкое удаление"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save()
    
    def restore(self):
        """Восстановление из корзины"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save()

class StorageFolder(SoftDeleteMixin):
    TYPE_CHOICES = [
        ('personal', 'Личное'),
        ('work', 'Рабочее'),
    ]
    
    name = models.CharField(max_length=255, verbose_name='Название')
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='subfolders', 
        verbose_name='Родительская папка'
    )
    folder_type = models.CharField(
        max_length=10, 
        choices=TYPE_CHOICES, 
        default='work', 
        verbose_name='Тип папки'
    )
    division = models.ForeignKey(
        Division, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='folders',
        verbose_name='Подразделение'
    )
    subdivision = models.ForeignKey(
        Subdivision, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='folders',
        verbose_name='Отделение'
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_folders', 
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_pinned = models.BooleanField(default=False, verbose_name='Закреплено')
    color = models.CharField(max_length=7, default='#1976D2', verbose_name='Цвет папки')
    
    class Meta:
        verbose_name = 'Папка'
        verbose_name_plural = 'Папки'
        ordering = ['is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['folder_type', 'is_deleted']),
            models.Index(fields=['division', 'subdivision']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_ancestors(self, include_self=True):
        """Рекурсивно получаем всех предков папки"""
        ancestors = []
        current = self
        
        if not include_self:
            current = self.parent
        
        while current:
            ancestors.insert(0, current)  # Вставляем в начало
            current = current.parent
        
        return ancestors

    def get_full_path(self):
        """Получить полный путь как строку"""
        ancestors = self.get_ancestors()
        return '/'.join([folder.name for folder in ancestors])
    
    def get_total_size(self):
        """Общий размер всех файлов в папке (включая подпапки)"""
        from django.db.models import Sum
        total = self.files.aggregate(Sum('size'))['size__sum'] or 0
        
        for subfolder in self.subfolders.all():
            total += subfolder.get_total_size()
        
        return total
    
    def save(self, *args, **kwargs):
        """Автоматически наследуем division и subdivision от родительской папки"""
        if self.parent and not self.division:
            self.division = self.parent.division
            self.subdivision = self.parent.subdivision
        
        # Если это корневая папка рабочего типа, устанавливаем division пользователя
        if not self.parent and self.folder_type == 'work' and self.created_by and not self.division:
            # Получаем division из профиля пользователя
            if hasattr(self.created_by, 'division'):
                self.division = self.created_by.division
            if hasattr(self.created_by, 'subdivision'):
                self.subdivision = self.created_by.subdivision
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Переопределяем удаление для мягкого удаления всех вложенных файлов"""
        for file in self.files.all():
            file.soft_delete()
        for subfolder in self.subfolders.all():
            subfolder.soft_delete()
        self.soft_delete()
    
    def hard_delete(self):
        """Полное удаление из БД"""
        super().delete()

    def is_descendant_of(self, other):
        """Проверяет, является ли текущая папка потомком other"""
        current = self.parent
        while current:
            if current == other:
                return True
            current = current.parent
        return False

class StorageFile(SoftDeleteMixin):
    TYPE_CHOICES = [
        ('personal', 'Личное'),
        ('work', 'Рабочее'),
    ]
    
    name = models.CharField(max_length=255, verbose_name='Название')
    original_name = models.CharField(max_length=255, verbose_name='Оригинальное имя файла')
    file = models.FileField(upload_to='storage/%Y/%m/%d/', verbose_name='Файл')
    size = models.BigIntegerField(verbose_name='Размер (байты)')
    mime_type = models.CharField(max_length=255, verbose_name='MIME тип')
    extension = models.CharField(max_length=50, verbose_name='Расширение')
    file_type = models.CharField(
        max_length=10, 
        choices=TYPE_CHOICES, 
        default='work', 
        verbose_name='Тип файла'
    )
    folder = models.ForeignKey(
        StorageFolder, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='files', 
        verbose_name='Папка'
    )
    division = models.ForeignKey(
        Division, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='files',
        verbose_name='Подразделение'
    )
    subdivision = models.ForeignKey(
        Subdivision, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='files',
        verbose_name='Отделение'
    )
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_files', 
        verbose_name='Загрузил'
    )
    is_pinned = models.BooleanField(default=False, verbose_name='Закреплено')
    download_count = models.IntegerField(default=0, verbose_name='Количество скачиваний')
    last_downloaded = models.DateTimeField(null=True, blank=True, verbose_name='Последнее скачивание')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'
        ordering = ['is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['file_type', 'is_deleted']),
            models.Index(fields=['mime_type']),
            models.Index(fields=['division', 'subdivision']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Автоматически определяем расширение при сохранении"""
        if self.file and not self.extension:
            self.extension = self.get_file_extension()
        super().save(*args, **kwargs)
    
    def get_file_extension(self):
        """Получить расширение файла"""
        import os
        return os.path.splitext(self.file.name)[1].lower()
    
    def get_human_readable_size(self):
        """Размер в читаемом формате"""
        size = self.size
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"
    
    def increment_download_count(self):
        """Увеличить счетчик скачиваний"""
        self.download_count += 1
        self.last_downloaded = timezone.now()
        self.save()
    
    def delete(self, *args, **kwargs):
        """Мягкое удаление"""
        self.soft_delete()
    
    def hard_delete(self):
        """Полное удаление файла и физического файла"""
        if self.file:
            self.file.delete(save=False)
        super().delete()

class FileShareLink(models.Model):
    """Модель для публичных ссылок на файлы"""
    file = models.ForeignKey(
        StorageFile, 
        on_delete=models.CASCADE, 
        related_name='share_links',
        verbose_name='Файл'
    )
    token = models.CharField(max_length=100, unique=True, verbose_name='Токен доступа')
    password = models.CharField(max_length=255, null=True, blank=True, verbose_name='Пароль')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='Истекает')
    max_downloads = models.IntegerField(null=True, blank=True, verbose_name='Макс. скачиваний')
    download_count = models.IntegerField(default=0, verbose_name='Скачано')
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    
    class Meta:
        verbose_name = 'Ссылка для общего доступа'
        verbose_name_plural = 'Ссылки для общего доступа'
        ordering = ['-created_at']
    
    def is_expired(self):
        """Проверить, истекла ли ссылка"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def can_be_downloaded(self):
        """Можно ли скачать файл по ссылке"""
        if not self.is_active:
            return False
        if self.is_expired():
            return False
        if self.max_downloads and self.download_count >= self.max_downloads:
            return False
        return True

class Favorite(models.Model):
    """Избранные файлы и папки"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='favorites',
        verbose_name='Пользователь'
    )
    folder = models.ForeignKey(
        StorageFolder, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='favorited_by',
        verbose_name='Папка'
    )
    file = models.ForeignKey(
        StorageFile, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='favorited_by',
        verbose_name='Файл'
    )
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранные'
        unique_together = [
            ('user', 'folder'),
            ('user', 'file'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(folder__isnull=False) | models.Q(file__isnull=False),
                name='either_folder_or_file'
            )
        ]
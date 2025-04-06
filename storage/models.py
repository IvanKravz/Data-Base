from django.db import models
from django.utils import timezone
from users.models import User

class StorageFolder(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subfolders', verbose_name='Родительская папка')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_folders', verbose_name='Создал')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Папка'
        verbose_name_plural = 'Папки'
        ordering = ['name']

class StorageFile(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    file = models.FileField(upload_to='storage/', verbose_name='Файл')
    size = models.BigIntegerField(verbose_name='Размер')
    mime_type = models.CharField(max_length=255, verbose_name='MIME тип')
    folder = models.ForeignKey(StorageFolder, null=True, blank=True, on_delete=models.CASCADE, related_name='files', verbose_name='Папка')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_files', verbose_name='Загрузил')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'
        ordering = ['-created_at']
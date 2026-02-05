"""
Функции для логирования действий с хранилищем
"""

from django.utils import timezone
from django.db import models
from django.contrib.auth import get_user_model
from ..logs_models import UserActionLog
from .base import log_user_action
from .utils import format_file_size
import logging

logger = logging.getLogger(__name__)


def log_storage_action(user, action, file_path, **kwargs):
    """
    Специальная функция для логирования действий с хранилищем
    """
    return log_user_action(
        user=user,
        action=action,
        module='storage',
        file_path=file_path,
        **kwargs
    )


def get_storage_statistics(user, days=30):
    """
    Получение статистики по использованию хранилища
    """
    try:
        User = get_user_model()
        
        if isinstance(user, str):
            user = User.objects.get(username=user)
        
        date_from = timezone.now() - timezone.timedelta(days=days)
        
        # Общая статистика по хранилищу
        storage_logs = UserActionLog.objects.filter(
            user=user,
            module='storage',
            created_at__gte=date_from
        )
        
        total_actions = storage_logs.count()
        
        # Статистика по типам действий
        actions_by_type = storage_logs.values('action').annotate(
            count=models.Count('id'),
            total_size=models.Sum('file_size')
        ).order_by('-count')
        
        # Статистика по типам файлов
        files_by_type = storage_logs.exclude(file_type__isnull=True).values('file_type').annotate(
            count=models.Count('id'),
            total_size=models.Sum('file_size')
        ).order_by('-total_size')
        
        # Статистика по местам хранения
        storage_by_location = storage_logs.exclude(storage_location__isnull=True).values('storage_location').annotate(
            count=models.Count('id'),
            total_size=models.Sum('file_size')
        ).order_by('-total_size')
        
        # Общий объем загруженных файлов
        upload_stats = storage_logs.filter(action='upload').aggregate(
            total_count=models.Count('id'),
            total_size=models.Sum('file_size')
        )
        
        # Общий объем скачанных файлов
        download_stats = storage_logs.filter(action='download').aggregate(
            total_count=models.Count('id'),
            total_size=models.Sum('file_size')
        )
        
        # Самые большие файлы
        largest_files = storage_logs.exclude(
            file_size__isnull=True
        ).order_by('-file_size')[:10].values(
            'file_path', 'file_size', 'file_type', 'created_at'
        )
        
        # Форматируем размеры файлов
        for file in largest_files:
            file['formatted_size'] = format_file_size(file['file_size'])
        
        return {
            'total_actions': total_actions,
            'actions_by_type': list(actions_by_type),
            'files_by_type': list(files_by_type),
            'storage_by_location': list(storage_by_location),
            'upload_stats': {
                'count': upload_stats['total_count'] or 0,
                'total_size': upload_stats['total_size'] or 0,
                'formatted_size': format_file_size(upload_stats['total_size'] or 0),
            },
            'download_stats': {
                'count': download_stats['total_count'] or 0,
                'total_size': download_stats['total_size'] or 0,
                'formatted_size': format_file_size(download_stats['total_size'] or 0),
            },
            'largest_files': list(largest_files),
            'period': {
                'from': date_from,
                'to': timezone.now(),
                'days': days
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting storage statistics: {str(e)}")
        return {}
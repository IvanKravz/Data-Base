# logging_utils.py - исправленный
import logging
import os
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import models
from .logs_models import UserActionLog

logger = logging.getLogger(__name__)

def log_user_action(user, action, module, **kwargs):
    """
    Утилита для логирования действий пользователя
    """
    try:
        User = get_user_model()
        
        if isinstance(user, str):
            user = User.objects.get(username=user)
        elif not isinstance(user, User):
            return False
        
        details = kwargs.get('details', {})
        model_name = kwargs.get('model_name')
        object_id = kwargs.get('object_id')
        object_name = kwargs.get('object_name')
        request = kwargs.get('request')
        file_path = kwargs.get('file_path')
        file_size = kwargs.get('file_size')
        file_type = kwargs.get('file_type')
        storage_location = kwargs.get('storage_location')
        
        # Автоматически определяем тип файла по расширению
        if file_path and not file_type:
            _, ext = os.path.splitext(file_path)
            file_type = ext.lower().lstrip('.') if ext else 'unknown'
        
        log_entry = UserActionLog.objects.create(
            user=user,
            action=action,
            module=module,
            model_name=model_name,
            object_id=object_id,
            object_name=object_name,
            details=details,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT')[:500] if request and 'HTTP_USER_AGENT' in request.META else None,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            storage_location=storage_location,
        )
        
        logger.info(f"User action logged: {user.username} - {action} - {module}")
        return log_entry
        
    except Exception as e:
        logger.error(f"Error logging user action: {str(e)}")
        return False

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

def get_user_action_logs(user, days=30, **filters):
    """
    Получение логов действий пользователя с фильтрацией
    """
    try:
        User = get_user_model()
        
        if isinstance(user, str):
            user = User.objects.get(username=user)
        
        date_from = filters.get('date_from')
        date_to = filters.get('date_to')
        
        if not date_from:
            date_from = timezone.now() - timezone.timedelta(days=days)
        
        queryset = UserActionLog.objects.filter(
            user=user,
            created_at__gte=date_from
        )
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        action = filters.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        module = filters.get('module')
        if module:
            queryset = queryset.filter(module=module)
        
        file_type = filters.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        storage_location = filters.get('storage_location')
        if storage_location:
            queryset = queryset.filter(storage_location=storage_location)
        
        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(object_name__icontains=search) |
                models.Q(details__icontains=search) |
                models.Q(model_name__icontains=search) |
                models.Q(file_path__icontains=search)
            )
        
        return queryset.order_by('-created_at')
        
    except Exception as e:
        logger.error(f"Error getting user action logs: {str(e)}")
        return UserActionLog.objects.none()

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
        total_upload_size = storage_logs.filter(action='upload').aggregate(
            total=models.Sum('file_size')
        )['total'] or 0
        
        # Общий объем скачанных файлов
        total_download_size = storage_logs.filter(action='download').aggregate(
            total=models.Sum('file_size')
        )['total'] or 0
        
        return {
            'total_actions': total_actions,
            'actions_by_type': list(actions_by_type),
            'files_by_type': list(files_by_type),
            'storage_by_location': list(storage_by_location),
            'total_upload_size': total_upload_size,
            'total_download_size': total_download_size,
            'upload_count': storage_logs.filter(action='upload').count(),
            'download_count': storage_logs.filter(action='download').count(),
        }
        
    except Exception as e:
        logger.error(f"Error getting storage statistics: {str(e)}")
        return {}
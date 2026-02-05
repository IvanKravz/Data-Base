"""
Базовые функции для логирования действий пользователей
"""

import logging
import os
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import models
from django.apps import apps

from ..logs_models import UserActionLog

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
            file_type = extract_file_extension(file_path)
        
        # Создаем запись лога
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
        
        # Применяем фильтры
        action = filters.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        module = filters.get('module')
        if module:
            queryset = queryset.filter(module=module)
        
        model_name = filters.get('model_name')
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        
        file_type = filters.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        storage_location = filters.get('storage_location')
        if storage_location:
            queryset = queryset.filter(storage_location=storage_location)
        
        # Поиск по тексту
        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(object_name__icontains=search) |
                models.Q(details__icontains=search) |
                models.Q(model_name__icontains=search) |
                models.Q(file_path__icontains=search)
            )
        
        # Сортировка
        order_by = filters.get('order_by', '-created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
        
    except Exception as e:
        logger.error(f"Error getting user action logs: {str(e)}")
        return UserActionLog.objects.none()


def get_user_statistics(user, days=30):
    """
    Получение общей статистики по действиям пользователя
    """
    try:
        date_from = timezone.now() - timezone.timedelta(days=days)
        
        # Общая статистика
        user_logs = UserActionLog.objects.filter(
            user=user,
            created_at__gte=date_from
        )
        
        total_actions = user_logs.count()
        
        # Статистика по модулям
        actions_by_module = user_logs.values('module').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Статистика по действиям
        actions_by_type = user_logs.values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Активность по дням
        activity_by_day = user_logs.extra(
            select={'day': "DATE(created_at)"}
        ).values('day').annotate(
            count=models.Count('id')
        ).order_by('day')
        
        # Самые частые операции
        frequent_operations = user_logs.values(
            'action', 'module', 'model_name'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        return {
            'total_actions': total_actions,
            'actions_by_module': list(actions_by_module),
            'actions_by_type': list(actions_by_type),
            'activity_by_day': list(activity_by_day),
            'frequent_operations': list(frequent_operations),
            'period': {
                'from': date_from,
                'to': timezone.now(),
                'days': days
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting user statistics: {str(e)}")
        return {}
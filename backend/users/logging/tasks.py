"""
Функции для логирования действий с задачами (tasks)
"""

from ..logs_models import UserActionLog
from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_task_action(user, action, instance, **kwargs):
    """
    Общая функция для логирования действий с моделями модуля tasks.
    Поддерживает модели: Task, TaskStep.
    """
    module = 'tasks'
    model_name = instance.__class__.__name__
    
    details = kwargs.pop('details', {})
    
    # Базовая информация
    base_info = {
        'object_id': instance.id,
        'object_name': str(instance),
        'model': model_name,
    }
    
    # Дополнительная информация в зависимости от модели
    if model_name == 'Task':
        base_info.update({
            'task_id': instance.id,
            'task_title': instance.title,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'subdivision_id': instance.subdivision.id if instance.subdivision else None,
            'subdivision_name': instance.subdivision.name if instance.subdivision else None,
            'is_private': instance.is_private,
            'created_by_id': instance.created_by.id if instance.created_by else None,
            'created_by_name': instance.created_by.get_full_name() if instance.created_by else None,
        })
    elif model_name == 'TaskStep':
        base_info.update({
            'step_id': instance.id,
            'step_name': instance.name,
            'task_id': instance.task.id if instance.task else None,
            'task_name': instance.task.name if instance.task else None,
            'is_completed': instance.is_completed,
        })
    
    all_details = {**base_info, **details}
    
    return log_user_action(
        user=user,
        action=action,
        module=module,
        model_name=model_name,
        object_id=instance.id,
        object_name=str(instance),
        details=all_details,
        request=kwargs.get('request'),
        **{k: v for k, v in kwargs.items() if k not in ['details', 'request']}
    )


def log_task_create(user, instance, **kwargs):
    return log_task_action(user, 'create', instance, **kwargs)


def log_task_update(user, instance, old_data=None, **kwargs):
    details = kwargs.pop('details', {})
    if old_data:
        details['old_data'] = old_data
    return log_task_action(user, 'update', instance, details=details, **kwargs)


def log_task_delete(user, instance, **kwargs):
    return log_task_action(user, 'delete', instance, **kwargs)


def log_task_view(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['viewed_details'] = True
    return log_task_action(user, 'view', instance, details=details, **kwargs)


def log_taskstep_create(user, instance, **kwargs):
    return log_task_action(user, 'create', instance, **kwargs)


def log_taskstep_update(user, instance, old_data=None, **kwargs):
    details = kwargs.pop('details', {})
    if old_data:
        details['old_data'] = old_data
    return log_task_action(user, 'update', instance, details=details, **kwargs)


def log_taskstep_delete(user, instance, **kwargs):
    return log_task_action(user, 'delete', instance, **kwargs)


def log_taskstep_view(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['viewed_details'] = True
    return log_task_action(user, 'view', instance, details=details, **kwargs)


def log_taskstep_complete(user, instance, old_value, new_value, **kwargs):
    """
    Специализированная функция для логирования завершения/возобновления шага.
    """
    details = {
        'field': 'is_completed',
        'old_value': old_value,
        'new_value': new_value,
        'action_type': 'complete' if new_value else 'uncomplete',
    }
    return log_task_update(user, instance, details=details, **kwargs)
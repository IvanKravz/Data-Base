"""
Функции для логирования действий с объектами (Facility, Division, Subdivision и т.д.)
"""

from ..logs_models import UserActionLog
from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_facility_action(user, action, instance, **kwargs):
    """
    Общая функция для логирования действий с объектами модуля facilities.
    Поддерживает модели: Division, Subdivision, Facility, FacilityType, CommunicationPost.
    """
    module = 'facilities'
    model_name = instance.__class__.__name__
    
    details = kwargs.pop('details', {})  # <-- ИЗМЕНЕНО: извлекаем и удаляем из kwargs
    
    # Базовая информация, общая для всех
    base_info = {
        'object_id': instance.id,
        'object_name': str(instance),
    }
    
    # Дополнительная информация в зависимости от типа объекта
    if model_name == 'Division':
        base_info.update({
            'division_id': instance.id,
            'division_name': instance.name,
            'order': instance.order,
        })
    elif model_name == 'Subdivision':
        base_info.update({
            'subdivision_id': instance.id,
            'subdivision_name': instance.name,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'order': instance.order,
        })
    elif model_name == 'Facility':
        base_info.update({
            'facility_id': instance.id,
            'facility_name': instance.name,
            'type_id': instance.type.id if instance.type else None,
            'type_name': instance.type.name if instance.type else None,
            'facility_class': instance.facility_class,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'subdivision_id': instance.subdivision.id if instance.subdivision else None,
            'subdivision_name': instance.subdivision.name if instance.subdivision else None,
            'is_closed': instance.is_closed,
        })
    elif model_name == 'FacilityType':
        base_info.update({
            'facility_type_id': instance.id,
            'facility_type_name': instance.name,
        })
    elif model_name == 'CommunicationPost':
        base_info.update({
            'communication_post_id': instance.id,
            'communication_post_name': instance.name,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'subdivision_id': instance.subdivision.id if instance.subdivision else None,
            'subdivision_name': instance.subdivision.name if instance.subdivision else None,
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
        **{k: v for k, v in kwargs.items() if k not in ['details', 'request']}  # details уже извлечён
    )


def log_facility_create(user, instance, **kwargs):
    """Логирование создания объекта"""
    return log_facility_action(user, 'create', instance, **kwargs)


def log_facility_update(user, instance, old_data=None, **kwargs):
    """Логирование изменения объекта"""
    details = kwargs.pop('details', {})
    if old_data:
        details['old_data'] = old_data
    return log_facility_action(user, 'update', instance, details=details, **kwargs)


def log_facility_delete(user, instance, **kwargs):
    """Логирование удаления объекта"""
    return log_facility_action(user, 'delete', instance, **kwargs)


def log_facility_view(user, instance, **kwargs):
    """Логирование просмотра деталей объекта"""
    details = kwargs.pop('details', {})
    details['viewed_details'] = True
    return log_facility_action(user, 'view', instance, details=details, **kwargs)


def log_facility_status_change(user, instance, old_is_closed, **kwargs):
    """Логирование изменения статуса is_closed"""
    details = kwargs.pop('details', {})
    details.update({
        'field': 'is_closed',
        'old_value': old_is_closed,
        'new_value': instance.is_closed,
        'reason': kwargs.get('reason'),
    })
    return log_facility_action(user, 'update', instance, details=details, **kwargs)


def get_facility_statistics(user, days=30):
    """Получение статистики по действиям с объектами"""
    try:
        from django.utils import timezone
        from django.db import models

        date_from = timezone.now() - timezone.timedelta(days=days)
        
        logs = UserActionLog.objects.filter(
            user=user,
            module='facilities',
            created_at__gte=date_from
        )
        
        actions_by_type = logs.values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        actions_by_model = logs.values('model_name').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        recent_actions = logs.order_by('-created_at')[:10].values(
            'id', 'action', 'model_name', 'object_name', 'created_at', 'details'
        )
        
        return {
            'total_actions': logs.count(),
            'actions_by_type': list(actions_by_type),
            'actions_by_model': list(actions_by_model),
            'recent_actions': list(recent_actions),
            'period': {
                'from': date_from,
                'to': timezone.now(),
                'days': days
            }
        }
    except Exception as e:
        logger.error(f"Error getting facility statistics: {str(e)}")
        return {}
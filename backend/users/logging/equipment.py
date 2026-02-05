"""
Функции для логирования действий с оборудованием
"""

from django.utils import timezone
from django.db import models
from ..logs_models import UserActionLog
from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_equipment_action(user, action, equipment, **kwargs):
    """
    Специальная функция для логирования действий с оборудованием
    """
    # Определяем модуль на основе категории оборудования
    module = 'sha_equipment' if equipment.is_closed else 'equipment'
    
    # Подготавливаем детали
    details = kwargs.get('details', {})
    
    # Добавляем информацию об оборудовании
    equipment_info = {
        'equipment_id': equipment.id,
        'equipment_name': equipment.name,
        'category_name': equipment.category.name if equipment.category else None,
        'category_value': equipment.category.value if equipment.category else None,
        'status': equipment.status,
        'is_closed': equipment.is_closed,
        'is_network': equipment.is_network,
        'division_id': equipment.division.id if equipment.division else None,
        'division_name': equipment.division.name if equipment.division else None,
        'serial_number': equipment.serial_number,
        'inventory_number': equipment.inventory_number,
    }
    
    # Объединяем детали
    all_details = {**equipment_info, **details}
    
    return log_user_action(
        user=user,
        action=action,
        module=module,
        model_name=equipment.__class__.__name__,
        object_id=equipment.id,
        object_name=equipment.name,
        details=all_details,
        request=kwargs.get('request'),
        **{k: v for k, v in kwargs.items() if k not in ['details', 'request']}
    )


def log_equipment_disposal(user, equipment, disposal_data, **kwargs):
    """
    Логирование списания оборудования
    """
    return log_equipment_action(
        user=user,
        action='decommission',
        equipment=equipment,
        request=kwargs.get('request'),
        details={
            'disposal_data': disposal_data,
            'previous_status': equipment.status,
            'new_status': 'disposed',
            'act_number': disposal_data.get('actNumber'),
            'act_date': disposal_data.get('actDate'),
            'cert_number': disposal_data.get('disposalCertNumber'),
            'cert_date': disposal_data.get('disposalCertDate'),
            'comments': disposal_data.get('comments'),
        }
    )


def log_equipment_assignment(user, equipment, assigned_to, **kwargs):
    """
    Логирование назначения оборудования сотруднику
    """
    return log_equipment_action(
        user=user,
        action='assignment',
        equipment=equipment,
        request=kwargs.get('request'),
        details={
            'assigned_to_id': assigned_to.id if assigned_to else None,
            'assigned_to_name': str(assigned_to) if assigned_to else None,
            'assigned_to_position': getattr(assigned_to, 'position', None) if assigned_to else None,
            'previous_assigned_to_id': equipment.assigned_to.id if equipment.assigned_to else None,
            'previous_assigned_to_name': str(equipment.assigned_to) if equipment.assigned_to else None,
            'assignment_type': kwargs.get('assignment_type', 'direct'),
        }
    )


def log_equipment_move(user, equipment, facility, **kwargs):
    """
    Логирование перемещения оборудования
    """
    return log_equipment_action(
        user=user,
        action='move',
        equipment=equipment,
        request=kwargs.get('request'),
        details={
            'new_facility_id': facility.id if facility else None,
            'new_facility_name': str(facility) if facility else None,
            'new_division_id': facility.division.id if facility and facility.division else None,
            'new_division_name': facility.division.name if facility and facility.division else None,
            'previous_facility_id': equipment.facility.id if equipment.facility else None,
            'previous_facility_name': str(equipment.facility) if equipment.facility else None,
            'move_reason': kwargs.get('reason'),
        }
    )


def log_equipment_status_change(user, equipment, old_status, new_status, **kwargs):
    """
    Логирование изменения статуса оборудования
    """
    return log_equipment_action(
        user=user,
        action='update',
        equipment=equipment,
        request=kwargs.get('request'),
        details={
            'field': 'status',
            'old_status': old_status,
            'new_status': new_status,
            'change_reason': kwargs.get('reason'),
        }
    )


def get_equipment_statistics(user, days=30):
    """
    Получение статистики по действиям с оборудованием
    """
    try:
        date_from = timezone.now() - timezone.timedelta(days=days)
        
        # Получаем логи для оборудования и закрытой техники
        equipment_logs = UserActionLog.objects.filter(
            user=user,
            module__in=['equipment', 'sha_equipment'],
            created_at__gte=date_from
        )
        
        # Статистика по типам действий
        actions_by_type = equipment_logs.values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Статистика по типам оборудования (категориям)
        equipment_by_category = equipment_logs.filter(
            details__has_key='category_name'
        ).values('details__category_name').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Статистика по статусам оборудования
        equipment_by_status = equipment_logs.filter(
            details__has_key='status'
        ).values('details__status').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Статистика по подразделениям
        equipment_by_division = equipment_logs.filter(
            details__has_key='division_name'
        ).values('details__division_name').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Последние действия с оборудованием
        recent_equipment_actions = equipment_logs.order_by('-created_at')[:10].values(
            'id', 'action', 'object_name', 'created_at', 'details'
        )
        
        # Статистика по списанию
        decommission_stats = equipment_logs.filter(
            action='decommission'
        ).aggregate(
            total_count=models.Count('id'),
            last_decommission=models.Max('created_at')
        )
        
        # Самые активные единицы оборудования
        most_active_equipment = equipment_logs.values(
            'object_id', 'object_name'
        ).annotate(
            action_count=models.Count('id'),
            last_action=models.Max('created_at')
        ).order_by('-action_count')[:10]
        
        return {
            'total_actions': equipment_logs.count(),
            'actions_by_type': list(actions_by_type),
            'equipment_by_category': list(equipment_by_category),
            'equipment_by_status': list(equipment_by_status),
            'equipment_by_division': list(equipment_by_division),
            'decommission_stats': decommission_stats,
            'recent_actions': list(recent_equipment_actions),
            'most_active_equipment': list(most_active_equipment),
            'modules_summary': {
                'equipment': equipment_logs.filter(module='equipment').count(),
                'sha_equipment': equipment_logs.filter(module='sha_equipment').count(),
            },
            'period': {
                'from': date_from,
                'to': timezone.now(),
                'days': days
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment statistics: {str(e)}")
        return {}
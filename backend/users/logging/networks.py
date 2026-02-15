"""
Функции для логирования действий с сетями связи (networks)
"""

from ..logs_models import UserActionLog
from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_network_action(user, action, instance, **kwargs):
    """
    Общая функция для логирования действий с моделями модуля networks.
    Поддерживает: CommunicationNetwork, NetworkMembership, NetworkDirection,
                  VLAN, NetworkInterface, IPAddress, IPRange,
                  VLANConfiguration, RoutingTable, ACL.
    """
    module = 'networks'
    model_name = instance.__class__.__name__
    
    details = kwargs.pop('details', {})
    
    # Базовая информация
    base_info = {
        'object_id': instance.id,
        'object_name': str(instance),
        'model': model_name,
    }
    
    # Дополнительная информация в зависимости от модели
    if model_name == 'CommunicationNetwork':
        base_info.update({
            'network_id': instance.id,
            'network_name': instance.name,
            'network_class': instance.network_class,
            'security_level': instance.security_level,
        })
    elif model_name == 'NetworkMembership':
        base_info.update({
            'membership_id': instance.id,
            'network_id': instance.network.id if instance.network else None,
            'network_name': instance.network.name if instance.network else None,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'facility_id': instance.facility.id if instance.facility else None,
            'facility_name': instance.facility.name if instance.facility else None,
            'equipment_id': instance.equipment.id if instance.equipment else None,
            'equipment_name': instance.equipment.name if instance.equipment else None,
        })
    elif model_name == 'NetworkDirection':
        base_info.update({
            'direction_id': instance.id,
            'network_id': instance.network.id if instance.network else None,
            'network_name': instance.network.name if instance.network else None,
            'from_membership_id': instance.from_membership.id if instance.from_membership else None,
            'to_membership_id': instance.to_membership.id if instance.to_membership else None,
        })
    elif model_name == 'VLAN':
        base_info.update({
            'vlan_id': instance.id,
            'vlan_name': instance.name,
            'vlan_tag': instance.vlan_id,
        })
    elif model_name == 'NetworkInterface':
        base_info.update({
            'interface_id': instance.id,
            'interface_name': instance.name,
            'equipment_id': instance.equipment.id if instance.equipment else None,
            'equipment_name': instance.equipment.name if instance.equipment else None,
            'interface_type': instance.interface_type,
        })
    elif model_name == 'IPAddress':
        base_info.update({
            'ipaddress_id': instance.id,
            'address': instance.address,
            'interface_id': instance.interface.id if instance.interface else None,
            'interface_name': instance.interface.name if instance.interface else None,
        })
    elif model_name == 'IPRange':
        base_info.update({
            'iprange_id': instance.id,
            'network': instance.network,
            'description': instance.description,
            'vlan_id': instance.vlan.id if instance.vlan else None,
            'vlan_name': instance.vlan.name if instance.vlan else None,
        })
    elif model_name == 'VLANConfiguration':
        base_info.update({
            'vlanconfig_id': instance.id,
            'interface_id': instance.interface.id if instance.interface else None,
            'interface_name': instance.interface.name if instance.interface else None,
            'vlan_id': instance.vlan.id if instance.vlan else None,
            'vlan_name': instance.vlan.name if instance.vlan else None,
        })
    elif model_name == 'RoutingTable':
        base_info.update({
            'route_id': instance.id,
            'equipment_id': instance.equipment.id if instance.equipment else None,
            'equipment_name': instance.equipment.name if instance.equipment else None,
            'network': instance.network,
        })
    elif model_name == 'ACL':
        base_info.update({
            'acl_id': instance.id,
            'name': instance.name,
            'equipment_id': instance.equipment.id if instance.equipment else None,
            'equipment_name': instance.equipment.name if instance.equipment else None,
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


def log_network_create(user, instance, **kwargs):
    return log_network_action(user, 'create', instance, **kwargs)


def log_network_update(user, instance, old_data=None, **kwargs):
    details = kwargs.pop('details', {})
    if old_data:
        details['old_data'] = old_data
    return log_network_action(user, 'update', instance, details=details, **kwargs)


def log_network_delete(user, instance, **kwargs):
    return log_network_action(user, 'delete', instance, **kwargs)


def log_network_view(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['viewed_details'] = True
    return log_network_action(user, 'view', instance, details=details, **kwargs)


def log_network_bulk_create(user, instances, network_id=None, **kwargs):
    """
    Логирование массового создания объектов (например, направлений или членств).
    """
    details = kwargs.pop('details', {})
    details.update({
        'bulk_create': True,
        'count': len(instances),
        'object_ids': [getattr(obj, 'id', None) for obj in instances],
        'object_names': [str(obj) for obj in instances],
        'network_id': network_id,
    })
    from .base import log_user_action
    return log_user_action(
        user=user,
        action='create',
        module='networks',
        model_name='BulkCreate',
        object_id=None,
        object_name=f'Bulk create of {len(instances)} items',
        details=details,
        request=kwargs.get('request'),
    )


def log_network_bulk_delete(user, queryset, network_id=None, **kwargs):
    """
    Логирование массового удаления (например, удаление всех направлений сети).
    """
    details = kwargs.pop('details', {})
    details.update({
        'bulk_delete': True,
        'count': queryset.count(),
        'network_id': network_id,
    })
    from .base import log_user_action
    return log_user_action(
        user=user,
        action='delete',
        module='networks',
        model_name='BulkDelete',
        object_id=None,
        object_name=f'Bulk delete of {queryset.count()} items',
        details=details,
        request=kwargs.get('request'),
    )
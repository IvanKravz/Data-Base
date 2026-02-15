"""
Функции для логирования действий с хранилищем (storage)
"""

from ..logs_models import UserActionLog
from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_storage_action(user, action, instance, **kwargs):
    """
    Общая функция для логирования действий с моделями модуля storage.
    Поддерживает модели: StorageFolder, StorageFile, FileShareLink, Favorite.
    """
    module = 'storage'
    model_name = instance.__class__.__name__
    
    details = kwargs.pop('details', {})
    
    # Базовая информация
    base_info = {
        'object_id': instance.id,
        'object_name': str(instance),
        'model': model_name,
    }
    
    # Дополнительная информация в зависимости от модели
    if model_name == 'StorageFolder':
        base_info.update({
            'folder_id': instance.id,
            'folder_name': instance.name,
            'folder_type': instance.folder_type,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'subdivision_id': instance.subdivision.id if instance.subdivision else None,
            'subdivision_name': instance.subdivision.name if instance.subdivision else None,
            'created_by_id': instance.created_by.id if instance.created_by else None,
            'created_by_name': instance.created_by.get_full_name() if instance.created_by else None,
            'parent_id': instance.parent.id if instance.parent else None,
            'parent_name': instance.parent.name if instance.parent else None,
            'is_pinned': instance.is_pinned,
            'is_deleted': instance.is_deleted,
        })
    elif model_name == 'StorageFile':
        base_info.update({
            'file_id': instance.id,
            'file_name': instance.name,
            'original_name': instance.original_name,
            'file_type': instance.file_type,
            'size': instance.size,
            'extension': instance.extension,
            'mime_type': instance.mime_type,
            'division_id': instance.division.id if instance.division else None,
            'division_name': instance.division.name if instance.division else None,
            'subdivision_id': instance.subdivision.id if instance.subdivision else None,
            'subdivision_name': instance.subdivision.name if instance.subdivision else None,
            'uploaded_by_id': instance.uploaded_by.id if instance.uploaded_by else None,
            'uploaded_by_name': instance.uploaded_by.get_full_name() if instance.uploaded_by else None,
            'folder_id': instance.folder.id if instance.folder else None,
            'folder_name': instance.folder.name if instance.folder else None,
            'is_pinned': instance.is_pinned,
            'is_deleted': instance.is_deleted,
            'download_count': instance.download_count,
        })
    elif model_name == 'FileShareLink':
        base_info.update({
            'sharelink_id': instance.id,
            'file_id': instance.file.id if instance.file else None,
            'file_name': instance.file.name if instance.file else None,
            'created_by_id': instance.created_by.id if instance.created_by else None,
            'created_by_name': instance.created_by.get_full_name() if instance.created_by else None,
            'is_active': instance.is_active,
            'expires_at': instance.expires_at,
            'download_count': instance.download_count,
        })
    elif model_name == 'Favorite':
        base_info.update({
            'favorite_id': instance.id,
            'user_id': instance.user.id,
            'user_name': instance.user.get_full_name() if instance.user else None,
            'folder_id': instance.folder.id if instance.folder else None,
            'folder_name': instance.folder.name if instance.folder else None,
            'file_id': instance.file.id if instance.file else None,
            'file_name': instance.file.name if instance.file else None,
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


def log_storage_create(user, instance, **kwargs):
    return log_storage_action(user, 'create', instance, **kwargs)


def log_storage_update(user, instance, old_data=None, **kwargs):
    details = kwargs.pop('details', {})
    if old_data:
        details['old_data'] = old_data
    return log_storage_action(user, 'update', instance, details=details, **kwargs)


def log_storage_delete(user, instance, **kwargs):
    return log_storage_action(user, 'delete', instance, **kwargs)


def log_storage_view(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['viewed_details'] = True
    return log_storage_action(user, 'view', instance, details=details, **kwargs)


def log_storage_download(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['download_action'] = True
    return log_storage_action(user, 'download', instance, details=details, **kwargs)


def log_storage_move(user, instance, target_folder=None, **kwargs):
    details = kwargs.pop('details', {})
    details.update({
        'action_type': 'move',
        'target_folder_id': target_folder.id if target_folder else None,
        'target_folder_name': target_folder.name if target_folder else None,
    })
    return log_storage_action(user, 'move', instance, details=details, **kwargs)


def log_storage_rename(user, instance, old_name, new_name, **kwargs):
    details = kwargs.pop('details', {})
    details.update({
        'action_type': 'rename',
        'old_name': old_name,
        'new_name': new_name,
    })
    return log_storage_action(user, 'update', instance, details=details, **kwargs)


def log_storage_soft_delete(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['soft_delete'] = True
    return log_storage_action(user, 'delete', instance, details=details, **kwargs)


def log_storage_restore(user, instance, **kwargs):
    details = kwargs.pop('details', {})
    details['restore'] = True
    return log_storage_action(user, 'restore', instance, details=details, **kwargs)


def log_storage_pin(user, instance, pinned_status, **kwargs):
    details = kwargs.pop('details', {})
    details.update({
        'action_type': 'pin',
        'pinned': pinned_status,
    })
    return log_storage_action(user, 'update', instance, details=details, **kwargs)


def log_storage_share(user, instance, **kwargs):
    return log_storage_action(user, 'share', instance, **kwargs)


def log_storage_bulk_create(user, instances, **kwargs):
    details = kwargs.pop('details', {})
    details.update({
        'bulk_create': True,
        'count': len(instances),
        'object_ids': [getattr(obj, 'id', None) for obj in instances],
    })
    from .base import log_user_action
    return log_user_action(
        user=user,
        action='create',
        module='storage',
        model_name='BulkCreate',
        object_id=None,
        object_name=f'Bulk create of {len(instances)} items',
        details=details,
        request=kwargs.get('request'),
    )


def log_storage_empty_trash(user, count, **kwargs):
    details = kwargs.pop('details', {})
    details.update({
        'action_type': 'empty_trash',
        'deleted_count': count,
    })
    from .base import log_user_action
    return log_user_action(
        user=user,
        action='delete',
        module='storage',
        model_name='Trash',
        object_id=None,
        object_name='Empty trash',
        details=details,
        request=kwargs.get('request'),
    )

def get_storage_statistics(user, days=30):
    """
    Получение статистики по действиям с хранилищем
    """
    try:
        from django.utils import timezone
        from django.db import models

        date_from = timezone.now() - timezone.timedelta(days=days)

        # Получаем логи для модуля storage
        storage_logs = UserActionLog.objects.filter(
            user=user,
            module='storage',
            created_at__gte=date_from
        )

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

        return {
            'total_actions': storage_logs.count(),
            'actions_by_type': list(actions_by_type),
            'files_by_type': list(files_by_type),
            'storage_by_location': list(storage_by_location),
            'upload_stats': {
                'count': upload_stats['total_count'] or 0,
                'total_size': upload_stats['total_size'] or 0,
            },
            'download_stats': {
                'count': download_stats['total_count'] or 0,
                'total_size': download_stats['total_size'] or 0,
            },
            'period': {
                'from': date_from,
                'to': timezone.now(),
                'days': days
            }
        }
    except Exception as e:
        logger.error(f"Error getting storage statistics: {str(e)}")
        return {}
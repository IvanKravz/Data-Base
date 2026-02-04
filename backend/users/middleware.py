import logging
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import re

logger = logging.getLogger(__name__)


class UserActionLoggingMiddleware(MiddlewareMixin):
    """Middleware для автоматического логирования действий пользователя"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.excluded_paths = [
            '/static/', 
            '/media/', 
            '/api/logs/',     
            '/favicon.ico',
            '/admin/',
        ]
        self.method_action_map = {
            'GET': 'view',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        self.path_module_map = {
            'employees': 'employees',
            'equipment': 'equipment',
            'facilities': 'facilities',
            'tasks': 'tasks',
            'networks': 'networks',
            'users': 'users',
            'divisions': 'divisions',
            'subdivisions': 'subdivisions',
            'storage': 'storage',
            'sha-workers': 'sha_workers',
            'sha-equipment': 'sha_equipment',
            'token': 'auth',
        }
    
    def _is_excluded_path(self, path):
        """Проверяет, является ли путь исключенным"""
        return any(path.startswith(excluded) for excluded in self.excluded_paths)
    
    def _get_module_from_path(self, path):
        """Определяет модуль по пути запроса"""
        for key in self.path_module_map:
            if f'/{key}/' in path or f'/api/{key}/' in path:
                return self.path_module_map[key]
        return 'system'
    
    def _get_object_id_from_api_path(self, path):
        """Извлекает ID объекта из API URL"""
        # ИСПРАВЛЕНИЕ: используем переданный параметр path, а не request.path
        if path.startswith('/api/'):
            match = re.search(r'/api/(\w+)/(\d+)/?$', path)
            return match.group(2) if match else None
        return None
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Пропускаем анонимных пользователей
        if not request.user.is_authenticated:
            return
        
        # Проверяем исключенные пути
        if self._is_excluded_path(request.path):
            return
        
        # Обработка logout
        if 'logout' in request.path.lower():
            from users.logging_utils import log_user_action
            
            try:
                log_user_action(
                    user=request.user,
                    action='logout',
                    module='auth',
                    request=request,
                    details={
                        'path': request.path,
                        'method': request.method,
                        'view': view_func.__name__ if view_func else None,
                        'source': 'middleware'
                    }
                )
            except Exception as e:
                logger.error(f"Error logging logout action: {str(e)}")
            return
        
        # Определяем действие по методу запроса
        action = self.method_action_map.get(request.method)
        if not action:
            return
        
        # Определяем модуль и логируем действие
        module = self._get_module_from_path(request.path)
        # ИСПРАВЛЕНИЕ: передаем request.path в метод
        object_id = self._get_object_id_from_api_path(request.path)
        
        from users.logging_utils import log_user_action
        
        try:
            log_user_action(
                user=request.user,
                action=action,
                module=module,
                request=request,
                details={
                    'path': request.path,
                    'method': request.method,
                    'view': view_func.__name__ if view_func else None,
                },
                object_id=object_id
            )
        except Exception as e:
            logger.error(f"Error in process_view logging: {str(e)}")
    
    def process_response(self, request, response):
        # Логирование действий с файлами
        if request.user.is_authenticated:
            # Проверяем загрузку файлов
            if request.method == 'POST' and request.FILES:
                from users.logging_utils import log_storage_action
                
                for file in request.FILES.getlist('file'):
                    try:
                        log_storage_action(
                            user=request.user,
                            action='upload',
                            file_path=file.name,
                            file_size=file.size,
                            request=request,
                            details={
                                'field_name': 'file',
                                'content_type': file.content_type,
                            }
                        )
                    except Exception as e:
                        logger.error(f"Error logging file upload: {str(e)}")
            
            # Проверяем скачивание файлов
            elif request.method == 'GET' and 'download' in request.path:
                from users.logging_utils import log_storage_action
                
                try:
                    log_storage_action(
                        user=request.user,
                        action='download',
                        file_path=request.path,
                        request=request,
                        details={
                            'download_path': request.path,
                        }
                    )
                except Exception as e:
                    logger.error(f"Error logging file download: {str(e)}")
        
        return response
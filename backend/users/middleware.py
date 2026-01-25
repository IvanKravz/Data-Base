import logging
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)

class UserActionLoggingMiddleware(MiddlewareMixin):
    """Middleware для автоматического логирования действий пользователя"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.excluded_paths = [
            '/static/', 
            '/media/', 
            '/api/logs/',
            '/api/token/',
            '/api/token/refresh/',
            '/favicon.ico',
            '/admin/',
        ]
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Пропускаем анонимных пользователей
        if not request.user.is_authenticated:
            return
        
        # Проверяем исключенные пути
        path = request.path
        if any(path.startswith(excluded) for excluded in self.excluded_paths):
            return
        
        # Импортируем здесь, чтобы избежать циклического импорта
        from users.logging_utils import log_user_action, log_storage_action
        
        # Определяем действие по методу запроса
        method_action_map = {
            'GET': 'view',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        
        action = method_action_map.get(request.method)
        if not action:
            return
        
        # Определяем модуль по пути
        path_module_map = {
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
            'auth': 'auth',
        }
        
        module = 'system'
        for key, value in path_module_map.items():
            if f'/{key}/' in request.path or f'/api/{key}/' in request.path:
                module = value
                break
        
        # Для API запросов получаем ID объекта из URL
        object_id = None
        if request.path.startswith('/api/'):
            import re
            # Ищем паттерн /api/module/<id>/
            pattern = r'/api/(\w+)/(\d+)/?$'
            match = re.search(pattern, request.path)
            if match:
                object_id = match.group(2)
        
        # Логируем действие
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
                }
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
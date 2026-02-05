"""
Вспомогательные функции для логирования
"""

import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def extract_file_extension(file_path):
    """
    Извлекает расширение файла из пути
    """
    if not file_path:
        return None
    
    _, ext = os.path.splitext(file_path)
    return ext.lower().lstrip('.') if ext else 'unknown'


def format_file_size(size_bytes):
    """
    Форматирует размер файла в читаемый вид
    """
    if not size_bytes:
        return "0 Б"
    
    for unit in ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} ПБ"


def validate_log_data(data):
    """
    Проверяет данные для логирования на корректность
    """
    if not data:
        return False
    
    required_fields = ['user', 'action', 'module']
    for field in required_fields:
        if field not in data:
            logger.warning(f"Missing required field in log data: {field}")
            return False
    
    return True


def get_client_ip(request):
    """
    Получает IP-адрес клиента из запроса
    """
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """
    Получает User-Agent из запроса
    """
    if not request:
        return None
    
    return request.META.get('HTTP_USER_AGENT')


def truncate_string(value, max_length=500):
    """
    Обрезает строку до указанной длины
    """
    if not value or not isinstance(value, str):
        return value
    
    if len(value) <= max_length:
        return value
    
    return value[:max_length] + '...'


def parse_date_string(date_string, format='%Y-%m-%d'):
    """
    Парсит строку даты в datetime объект
    """
    if not date_string:
        return None
    
    try:
        return datetime.strptime(date_string, format)
    except (ValueError, TypeError):
        logger.warning(f"Invalid date string format: {date_string}")
        return None


def safe_json_serialize(data):
    """
    Безопасно сериализует данные в JSON-совместимый формат
    """
    import json
    from django.core.serializers.json import DjangoJSONEncoder
    
    class SafeJSONEncoder(DjangoJSONEncoder):
        def default(self, obj):
            try:
                return super().default(obj)
            except TypeError:
                return str(obj)
    
    try:
        return json.dumps(data, cls=SafeJSONEncoder, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error serializing JSON: {str(e)}")
        return json.dumps({"error": "Could not serialize data"})
# threadlocals_middleware.py
from django.utils.deprecation import MiddlewareMixin
from .models import set_current_request

class ThreadLocalMiddleware(MiddlewareMixin):
    """Middleware для сохранения request в thread local storage"""
    
    def process_request(self, request):
        set_current_request(request)
        return None
    
    def process_response(self, request, response):
        from .models import _thread_locals
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        return response
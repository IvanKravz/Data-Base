# api/views.py
from django.http import JsonResponse

def error_400(request, exception=None):
    return JsonResponse({
        'error': 'BAD_REQUEST',
        'message': 'Неверный запрос',
        'status_code': 400
    }, status=400)

def error_403(request, exception=None):
    return JsonResponse({
        'error': 'FORBIDDEN',
        'message': 'Доступ запрещен',
        'status_code': 403
    }, status=403)

def error_404(request, exception=None):
    return JsonResponse({
        'error': 'NOT_FOUND',
        'message': 'Ресурс не найден',
        'status_code': 404
    }, status=404)

def error_500(request):
    return JsonResponse({
        'error': 'SERVER_ERROR',
        'message': 'Внутренняя ошибка сервера',
        'status_code': 500
    }, status=500)
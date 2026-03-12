# users/views.py
from datetime import timedelta
import logging
from django.utils import timezone as django_timezone
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from django.db import models
from django.contrib.auth import get_user_model, logout
from django.http import JsonResponse, HttpResponse
from .logging_utils import get_storage_statistics
import csv
from rest_framework import filters
from django.utils import timezone

from users.logging import log_user_action
from .permissions_config import ROLE_PERMISSIONS
from .models import User
from .logs_models import UserActionLog 
from .serializers import (
    StorageStatisticsSerializer, UserActionLogSerializer, UserSerializer, 
    TokenObtainPairSerializer
)
from .permissions import RoleBasedPermission, IsAdmin
from .mixins import UserAccessMixin

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    """
    Базовый ViewSet с общей логикой для всех моделей
    """
    
    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр"""
        from .permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            if self.action in ['create', 'update', 'partial_update', 'destroy']:
                raise PermissionDenied('Ваши роли позволяют только просматривать данные без возможности изменений')

    def create(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().destroy(request, *args, **kwargs)


class UserViewSet(UserAccessMixin, BaseViewSet):
    """
    ViewSet для управления пользователями
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Админы и суперпользователи видят всех
        if self.request.user.is_superuser or self.request.user.has_role('admin'):
            return queryset
        
        # Остальные - только себя
        return queryset.filter(id=self.request.user.id)
    
    # Логирование создания пользователя
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_201_CREATED:
            user_data = response.data
            log_user_action(
                user=request.user,
                action='create',
                module='users',
                request=request,
                model_name='User',
                object_id=user_data.get('id'),
                object_name=user_data.get('username'),
                details={'data': user_data}
            )
        
        return response
    
    # Логирование обновления пользователя
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = UserSerializer(instance).data
        
        response = super().update(request, *args, **kwargs)
        
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            new_data = response.data
            changed_fields = {}
            
            for key in old_data:
                if key in new_data and old_data[key] != new_data[key]:
                    changed_fields[key] = {
                        'old': old_data[key],
                        'new': new_data[key]
                    }
            
            log_user_action(
                user=request.user,
                action='update',
                module='users',
                request=request,
                model_name='User',
                object_id=instance.id,
                object_name=instance.username,
                details={'changed_fields': changed_fields}
            )
        
        return response
    
    # Логирование удаления пользователя
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user_data = UserSerializer(instance).data
        
        response = super().destroy(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_user_action(
                user=request.user,
                action='delete',
                module='users',
                request=request,
                model_name='User',
                object_id=instance.id,
                object_name=instance.username,
                details={'deleted_data': user_data}
            )
        
        return response
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Возвращает информацию о текущем пользователе"""
        
        # Логируем просмотр профиля
        log_user_action(
            user=request.user,
            action='view',
            module='users',
            request=request,
            model_name='User',
            object_id=request.user.id,
            object_name=request.user.username,
            details={'viewed_profile': True}
        )
        
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class TokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class TokenRefreshView(BaseTokenRefreshView):
    """View для обновления JWT токена"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Логируем обновление токена
            user = request.user if request.user.is_authenticated else None
            if user:
                log_user_action(
                    user=user,
                    action='update',
                    module='auth',
                    request=request,
                    details={'action': 'token_refresh'}
                )
        
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Выход из системы с логированием"""
    user = request.user
    
    # Логируем выход
    log_user_action(
        user=user,
        action='logout',
        module='auth',
        request=request,
        details={'logout_type': 'manual', 'source': 'logout_view'}
    )
    
    # Вызываем стандартный logout
    logout(request)
    
    return Response({'detail': 'Successfully logged out.'}, status=200)


class RegisterView(APIView):
    """
    View для регистрации новых пользователей
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                if user:
                    token_serializer = TokenObtainPairSerializer(data={
                        'username': request.data['username'],
                        'password': request.data['password']
                    })
                    if token_serializer.is_valid():
                        return Response(token_serializer.validated_data, status=status.HTTP_201_CREATED)
                    return Response(token_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(APIView):
    """
    View для получения профиля текущего пользователя
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class AvailableModulesView(APIView):
    """
    View для получения доступных модулей текущего пользователя
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        permissions_info = request.user.get_permissions_info()
        return Response({
            'modules': permissions_info['modules'],
            'permissions': permissions_info
        })


class SystemInfoView(APIView):
    """
    View для получения системной информации
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'roles': user.get_roles(),
                'division': user.division.name if user.division else None,
                'subdivision': user.subdivision.name if user.subdivision else None,
            },
            'permissions': user.get_permissions_info(),
            'system': {
                'total_users': User.objects.count(),
            }
        })


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


class UserActionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для получения логов действий пользователя
    """
    serializer_class = UserActionLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Фильтруем логи текущего пользователя
        queryset = UserActionLog.objects.all()

        # Админ может видеть логи любого пользователя
        if user.is_superuser or user.has_role('admin'):
            user_id = self.request.query_params.get('user_id')
            if user_id:
                queryset = queryset.filter(user_id=user_id)
        else:
            # Обычный пользователь видит только свои логи
            queryset = queryset.filter(user=user)
        
        # Фильтрация по действию
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Фильтрация по модулю
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        
        # Фильтрация по типу файла
        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        # Фильтрация по месту хранения
        storage_location = self.request.query_params.get('storage_location')
        if storage_location:
            queryset = queryset.filter(storage_location=storage_location)
        
        # Фильтрация по дате с
        date_from = self.request.query_params.get('date_from')
        if date_from:
            try:
                from datetime import datetime
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        # Фильтрация по дате по
        date_to = self.request.query_params.get('date_to')
        if date_to:
            try:
                from datetime import datetime
                date_to = datetime.strptime(date_to, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(object_name__icontains=search) |
                models.Q(details__icontains=search) |
                models.Q(model_name__icontains=search) |
                models.Q(file_path__icontains=search) |
                models.Q(action__icontains=search) |
                models.Q(module__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='action-choices')
    def action_choices(self, request):
        """Получение списка доступных действий"""
        return Response({
            'actions': [{'value': c[0], 'label': c[1]} for c in UserActionLog.ACTION_CHOICES],
            'modules': [{'value': c[0], 'label': c[1]} for c in UserActionLog.MODULE_CHOICES],
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Получаем базовый queryset с учётом прав доступа (см. get_queryset)
        queryset = self.get_queryset()

        # Если передан user_id и пользователь имеет права администратора, фильтруем по нему
        user_id = request.query_params.get('user_id')
        if user_id and (request.user.is_superuser or request.user.has_role('admin')):
            queryset = queryset.filter(user_id=user_id)

        # Ограничиваем последними 30 днями (или другим периодом, если нужно)
        last_30_days = django_timezone.now() - django_timezone.timedelta(days=30)
        queryset = queryset.filter(created_at__gte=last_30_days)

        total_actions = queryset.count()

        actions_by_type = queryset.values('action').annotate(count=models.Count('id')).order_by('-count')
        actions_by_module = queryset.values('module').annotate(count=models.Count('id')).order_by('-count')

        # Последний вход (действие login) для выбранного пользователя
        last_login = queryset.filter(action='login').order_by('-created_at').first()

        return Response({
            'total_actions': total_actions,
            'actions_by_type': list(actions_by_type),
            'actions_by_module': list(actions_by_module),
            'last_login': last_login.created_at if last_login else None,
        })
    
    @action(detail=False, methods=['get'], url_path='storage-stats')
    def storage_stats(self, request):
        """Получение статистики по хранилищу"""
       
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            days = 30
        
        stats = get_storage_statistics(request.user, days)
        serializer = StorageStatisticsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='file-types')
    def file_types(self, request):
        """Получение списка уникальных типов файлов"""
        file_types = UserActionLog.objects.filter(
            user=request.user,
            file_type__isnull=False
        ).values_list('file_type', flat=True).distinct().order_by('file_type')
        
        return Response(list(file_types))
    
    @action(detail=False, methods=['get'], url_path='storage-locations')
    def storage_locations(self, request):
        """Получение списка уникальных мест хранения"""
        locations = UserActionLog.objects.filter(
            user=request.user,
            storage_location__isnull=False
        ).values_list('storage_location', flat=True).distinct().order_by('storage_location')
        
        return Response(list(locations))
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Экспорт логов в CSV с поддержкой UTF-8"""
        logs = self.get_queryset()
        
        # Создаём ответ с правильной кодировкой
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="user_actions_{django_timezone.now().date()}.csv"'
        
        # Добавляем BOM для корректного отображения в Excel
        response.write('\ufeff')
        
        writer = csv.writer(response)
        writer.writerow([
            'Дата и время', 'Пользователь', 'Действие', 'Модуль', 'Объект',
            'ID объекта', 'Детали', 'IP адрес', 'Путь к файлу', 'Размер файла',
            'Тип файла', 'Место хранения'
        ])
        
        for log in logs:
            writer.writerow([
                django_timezone.localtime(log.created_at).strftime('%d.%m.%Y %H:%M:%S'),
                log.user.username,
                log.get_action_display(),
                log.get_module_display(),
                log.object_name or '',
                log.object_id or '',
                str(log.details) if log.details else '',
                log.ip_address or '',
                log.file_path or '',
                log.get_file_size_display(),
                log.file_type or '',
                log.storage_location or ''
            ])
        
        return response
    
    @action(detail=False, methods=['post'], url_path='bulk-delete', permission_classes=[IsAuthenticated, IsAdmin])
    def bulk_delete_logs(self, request):
        module = request.data.get('module')
        period = request.data.get('period')
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')

        # Если module == 'all' или не передан — удаляем по всем модулям
        if module and module != 'all':
            queryset = UserActionLog.objects.filter(module=module)
        else:
            queryset = UserActionLog.objects.all()

        # Обработка периода
        if period:
            now = django_timezone.now()
            period_map = {
                '1d': timedelta(days=1),
                '3d': timedelta(days=3),
                '1w': timedelta(days=7),
                '1m': timedelta(days=30),
                '3m': timedelta(days=90),
                '6m': timedelta(days=180),
                '1y': timedelta(days=365),
            }
            delta = period_map.get(period)
            if not delta:
                return Response({'error': f'Неизвестный период: {period}'},
                                status=status.HTTP_400_BAD_REQUEST)
            date_from = now - delta
            date_to = now

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        deleted_count, _ = queryset.delete()

        # Логируем действие администратора
        log_user_action(
            user=request.user,
            action='delete',
            module='system',
            request=request,
            model_name='UserActionLog',
            details={
                'deleted_count': deleted_count,
                'module': module if module != 'all' else 'all_modules',
                'period': period,
                'date_from': str(date_from) if date_from else None,
                'date_to': str(date_to) if date_to else None,
            }
        )

        return Response({
            'message': f'Удалено {deleted_count} записей логов.',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)
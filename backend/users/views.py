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
from django.contrib.auth import logout
from django.http import JsonResponse, HttpResponse
from .logging_utils import get_storage_statistics
import csv
from rest_framework import filters
from .models import RoleGroup
from .permissions_config import ROLE_PERMISSIONS, get_role_from_group

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

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from .serializers import TwoFactorVerifySerializer

from django.core.management import call_command
import tempfile
import os
from rest_framework.parsers import MultiPartParser

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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available_roles(self, request):
        """
        Возвращает список всех доступных ролей (групп) с их отображаемыми именами.
        Доступно только администраторам.
        """
        if not (request.user.is_superuser or request.user.has_role('admin')):
            raise PermissionDenied('Только администраторы могут просматривать список ролей')
        
        groups = RoleGroup.objects.all().order_by('name')
        data = []
        for group in groups:
            role_id = get_role_from_group(group.name)
            if role_id and role_id in ROLE_PERMISSIONS:
                data.append({
                    'id': group.id,
                    'role_id': role_id,
                    'name': ROLE_PERMISSIONS[role_id]['name'],
                    'description': ROLE_PERMISSIONS[role_id]['description'],
                })
        return Response(data)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Смена пароля текущим пользователем (с проверкой старого пароля)"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'Необходимо указать старый и новый пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Неверный старый пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Логируем действие
        log_user_action(
            user=user,
            action='update',
            module='users',
            request=request,
            model_name='User',
            object_id=user.id,
            object_name=user.username,
            details={'action': 'password_change'}
        )

        return Response({'status': 'ok'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])  
    def set_2fa(self, request, pk=None):
        """Установить 2FA код для пользователя (только админ)"""
        user = self.get_object()
        code = request.data.get('code')
        if not code or not code.isdigit() or len(code) != 4:
            return Response({'error': 'Код должен быть 4 цифры'}, status=400)
        user.two_factor_code = code
        user.two_factor_enabled = True
        user.save(update_fields=['two_factor_code', 'two_factor_enabled'])
        return Response({'status': '2FA enabled'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin]) 
    def disable_2fa(self, request, pk=None):
        """Отключить 2FA для пользователя"""
        user = self.get_object()
        user.two_factor_code = ''
        user.two_factor_enabled = False
        user.save(update_fields=['two_factor_code', 'two_factor_enabled'])
        return Response({'status': '2FA disabled'})


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
        # Принудительно обновляем пользователя из БД,
        # чтобы гарантировать актуальность групп и прав доступа
        user = User.objects.get(pk=request.user.pk)
        serializer = UserSerializer(user)
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
    
class TwoFactorVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temp_token = serializer.validated_data['temp_token']
        code = serializer.validated_data['code']

        try:
            access_token = AccessToken(temp_token)
            if not access_token.payload.get('temp_2fa'):
                return Response({'error': 'Invalid token type'}, status=status.HTTP_400_BAD_REQUEST)
            user_id = access_token.payload.get('user_id')
            user = User.objects.get(id=user_id)
        except Exception:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка статического кода
        if user.two_factor_enabled and user.two_factor_code == code:
            refresh = RefreshToken.for_user(user)
            log_user_action(
                user=user,
                action='login',
                module='auth',
                request=request,
                details={'login_type': '2fa'}
            )
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        else:
            return Response({'error': 'Неверный код двухфакторной аутентификации'}, status=status.HTTP_400_BAD_REQUEST)


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
    

class DatabaseBackupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_superuser or user.has_role('admin') or user.is_staff):
            return Response({'error': 'Доступ запрещён'}, status=403)

        # Список ваших приложений, которые нужно включить в бэкап
        APPS_TO_BACKUP = [
            'employees',
            'equipment',
            'facilities',
            'tasks',
            'networks',
            'users',          
            'storage',
            'map',
        ]

        # Исключаем ненужные модели внутри приложений
        EXCLUDE_MODELS = [
            'users.UserActionLog',   # логи не нужны в бэкапе
            'sessions.Session',
            'admin.LogEntry',
            'contenttypes.ContentType',  # может восстановиться автоматически
            'auth.Permission',
        ]

        args = ['--natural-foreign', '--natural-primary', '--indent', '2']
        args.extend(APPS_TO_BACKUP)
        for model in EXCLUDE_MODELS:
            args.extend(['--exclude', model])

        # Используем StringIO, так как dumpdata выводит текст
        from io import StringIO
        out = StringIO()
        try:
            call_command('dumpdata', stdout=out, *args)
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return Response({'error': f'Ошибка создания бэкапа: {str(e)}'}, status=500)

        response = HttpResponse(out.getvalue(), content_type='application/json')
        from django.utils import timezone
        filename = f"backup_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        # Добавляем CORS заголовок, если он нужен (хотя обычно его добавляет middleware)
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        return response
    
class DatabaseRestoreView(APIView):
    """
    Восстановление базы данных из загруженного JSON-файла (только для администраторов)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        user = request.user
        if not (user.is_superuser or user.has_role('admin') or user.is_staff):
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        # Получаем загруженный файл
        file_obj = request.FILES.get('backup_file')
        if not file_obj:
            return Response({'error': 'Файл не предоставлен'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем расширение и размер (например, не более 100 МБ)
        if not file_obj.name.endswith('.json'):
            return Response({'error': 'Неверный формат файла. Ожидается JSON.'}, status=status.HTTP_400_BAD_REQUEST)
        if file_obj.size > 100 * 1024 * 1024:  # 100 MB
            return Response({'error': 'Файл слишком большой (максимум 100 МБ)'}, status=status.HTTP_400_BAD_REQUEST)

        # Опционально: сбросить существующие данные?
        flush_first = request.data.get('flush_first') == 'true'

        # Сохраняем временный файл
        with tempfile.NamedTemporaryFile(mode='wb+', suffix='.json', delete=False) as tmp_file:
            for chunk in file_obj.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name

        try:
            if flush_first:
                # Сброс данных (только для указанных приложений, чтобы не трогать админов и сессии)
                # Внимание: эта операция опасна! Лучше предупредить пользователя.
                # Для простоты выполним flush всех данных (это удалит всех пользователей, включая текущего!)
                # Поэтому лучше не использовать flush, а загружать поверх.
                # Вместо этого оставим только загрузку данных (без очистки).
                pass

            # Загружаем фикстуру
            call_command('loaddata', tmp_file_path, verbosity=0)

            # Логируем действие
            log_user_action(
                user=user,
                action='restore',
                module='system',
                request=request,
                model_name='Database',
                details={
                    'filename': file_obj.name,
                    'size': file_obj.size,
                }
            )
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return Response({'error': f'Ошибка восстановления: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Удаляем временный файл
            os.unlink(tmp_file_path)

        return Response({'message': 'База данных успешно восстановлена из резервной копии.'}, status=status.HTTP_200_OK)
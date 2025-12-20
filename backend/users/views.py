# views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied

from users.permissions_config import ROLE_PERMISSIONS

from .models import User, Employee, ShaWorkerDetails, ShaEquipmentConclusion
from .serializers import (
    EmployeeDictionariesSerializer, UserSerializer, 
    TokenObtainPairSerializer, EmployeeSerializer, ShaWorkerDetailsSerializer, 
    ShaEquipmentConclusionSerializer
)
from .permissions import RoleBasedPermission, IsAdmin
from .mixins import RoleBasedFilterMixin, UserAccessMixin


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
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Админы и суперпользователи видят всех
        if self.request.user.is_superuser or self.request.user.has_role('admin'):
            return queryset
        
        # Остальные - только себя
        return queryset.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Возвращает информацию о текущем пользователе"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class EmployeeViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления сотрудниками
    """
    queryset = Employee.objects.all().order_by('priority', 'full_name')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['priority', 'full_name', 'category', 'position']
    ordering = ['priority', 'full_name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Для администраторов и суперпользователей показываем всех сотрудников
        if user.is_staff or user.is_superuser:
            return queryset
        
        # Проверяем наличие ролей напрямую
        has_roles = user.groups.filter(name__startswith='role_').exists()
        
        if has_roles:
            # Если есть роли - применяем фильтрацию через миксин
            # Используем RoleBasedPermission для проверки видимости всех подразделений
            permission_checker = RoleBasedPermission()
            user_roles = permission_checker._get_user_roles(user)
            
            # Проверяем, может ли пользователь видеть все подразделения
            can_see_all = any(
                role in ['admin', 'leader', 'deputy_director'] or
                ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
                for role in user_roles
            )
            
            if not can_see_all:
                user_division = getattr(user, 'division', None)
                if not user_division and hasattr(user, 'employee') and user.employee:
                    user_division = getattr(user.employee, 'division', None)
                
                if user_division:
                    queryset = queryset.filter(division=user_division)
                else:
                    queryset = queryset.none()
        else:
            # Если нет ролей - применяем фильтрацию по подразделению
            user_division = getattr(user, 'employee', None) and user.employee.division
            if user_division:
                queryset = queryset.filter(division=user_division)
            else:
                queryset = queryset.none()
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def dictionaries(self, request):
        """Возвращает справочники для формы сотрудника"""
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_officer_positions()],
            'warrant_officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_warrant_officer_positions()],
            'civilian_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_civilian_positions()],
            'management_officer_ranks': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_officer_ranks()],
            'officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_officer_ranks()],
            'warrant_officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_warrant_officer_ranks()],
        }
        serializer = EmployeeDictionariesSerializer(data)
        return Response(serializer.data)
    
    
class ShaWorkerViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления ШаРаботниками
    """
    queryset = ShaWorkerDetails.objects.all()
    serializer_class = ShaWorkerDetailsSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class ShaEquipmentConclusionViewSet(RoleBasedFilterMixin, BaseViewSet):
    """
    ViewSet для управления заключениями на технику
    """
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class TokenObtainPairView(BaseTokenObtainPairView):
    """
    View для получения JWT токена
    """
    serializer_class = TokenObtainPairSerializer
    permission_classes = [AllowAny]


class TokenRefreshView(BaseTokenRefreshView):
    """
    View для обновления JWT токена
    """
    permission_classes = [AllowAny]


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


class EmployeeDictionariesView(APIView):
    """
    View для получения справочников сотрудников
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_officer_positions()],
            'warrant_officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_warrant_officer_positions()],
            'civilian_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_civilian_positions()],
            'management_officer_ranks': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_officer_ranks()],
            'officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_officer_ranks()],
            'warrant_officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_warrant_officer_ranks()],
        }
        serializer = EmployeeDictionariesSerializer(data)
        return Response(serializer.data)


class EmployeePhotoView(APIView):
    """
    View для управления фотографиями сотрудников
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр"""
        from .permissions import RoleBasedPermission
        if RoleBasedPermission.is_view_only_user(self.request.user):
            raise PermissionDenied('Ваши роли позволяют только просматривать данные без возможности изменений')
    
    def patch(self, request, pk):
        self.check_view_only_restrictions()
        
        employee = get_object_or_404(Employee, pk=pk)
        new_photo = request.FILES.get('photo')
        
        if not new_photo:
            return Response(
                {'error': 'No photo provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if employee.photo:
                employee.photo.delete(save=False)
            
            employee.photo = new_photo
            employee.save()
            
            return Response({
                'id': employee.id,
                'photo_url': employee.photo.url if employee.photo else None
            })
            
        except Exception as e:
            return Response(
                {'error': 'Failed to update photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        self.check_view_only_restrictions()
        
        employee = get_object_or_404(Employee, pk=pk)
        
        try:
            if employee.photo:
                employee.delete_photo()
                return Response(
                    {
                        'id': employee.id,
                        'photo_url': None
                    },
                    headers={
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                )
            
            return Response(
                {'error': 'No photo to delete'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to delete photo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
                'total_employees': Employee.objects.count(),
                'total_sha_workers': Employee.objects.filter(is_sha_worker=True).count(),
                'total_users': User.objects.count(),
            }
        })
    
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
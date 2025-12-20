# facilities/views.py
from django.forms import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import CommunicationPost, Division, FacilityType, Subdivision, Facility
from .serializers import CommunicationPostSerializer, DivisionSerializer, FacilityTypeSerializer, SubdivisionSerializer, FacilitySerializer, FacilityStatsSerializer
from .mixins import DivisionAccessMixin, BaseViewSetMixin
from users.permissions import RoleBasedPermission  # Исправлен импорт
from rest_framework.exceptions import PermissionDenied

class DivisionViewSet(BaseViewSetMixin, viewsets.ModelViewSet):
    queryset = Division.objects.all().prefetch_related(
        'subdivisions',
        'facilities'
    ).annotate(
        networks_count=Count('networkmembership__network', distinct=True)
    )
    serializer_class = DivisionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        
        # Админы, суперпользователи и руководители видят все
        if (user.is_superuser or 
            (hasattr(user, 'has_role') and user.has_role('admin')) or 
            (hasattr(user, 'has_role') and user.has_role('leader')) or 
            (hasattr(user, 'has_role') and user.has_role('deputy_director'))):
            return super().get_queryset()
            
        # Роли эксплуатации видят только свое подразделение
        if ((hasattr(user, 'has_role') and user.has_role('exploitation_chief')) or
            (hasattr(user, 'has_role') and user.has_role('exploitation_employee'))):
            user_division = getattr(user, 'division', None)
            if user_division:
                return Division.objects.filter(id=user_division.id)
            return Division.objects.none()
            
        # Обычные пользователи видят только свое подразделение
        user_division = getattr(user, 'division', None)
        if user_division:
            return Division.objects.filter(id=user_division.id)
            
        return Division.objects.none()

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        # Проверяем доступ к подразделению
        division = self.get_object()
        user = request.user
        
        # Разрешаем доступ только если пользователь имеет права на это подразделение
        if not (user.is_superuser or 
                (hasattr(user, 'has_role') and user.has_role('admin')) or
                (hasattr(user, 'has_role') and user.has_role('leader')) or
                (hasattr(user, 'has_role') and user.has_role('deputy_director'))):
            user_division = getattr(user, 'division', None)
            if user_division and division.id != user_division.id:
                raise PermissionDenied('Нет доступа к этому подразделению')
                
        return Response({
            'users_count': division.users.count(),
            'equipment_count': division.equipment.count(),
            'tasks_count': division.tasks.count(),
            'tasks_completed': division.tasks.filter(
                steps__is_completed=True
            ).distinct().count(),
            'staff_completion': round((division.staff_actual / division.staff_planned) * 100, 2) if division.staff_planned > 0 else 0,
            'management_count': division.get_management_count(),
            'officers_count': division.get_officers_count(),
            'warrant_officers_count': division.get_warrant_officers_count(),
            'civilian_count': division.get_civilian_count(),
            'networks_count': division.get_networks_count(),
            'subdivisions': SubdivisionSerializer(division.subdivisions.all(), many=True).data,
            'facilities': FacilitySerializer(division.facilities.all(), many=True).data
        })

class SubdivisionViewSet(BaseViewSetMixin, DivisionAccessMixin, viewsets.ModelViewSet):
    queryset = Subdivision.objects.all().prefetch_related(
        'employees',
        'equipment',
        'facilities',
        'tasks'
    )
    serializer_class = SubdivisionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        division_id = self.request.query_params.get('division')
        
        # Дополнительная фильтрация по division из query params
        if division_id:
            user = self.request.user
            
            # Проверяем, имеет ли пользователь доступ к запрашиваемому подразделению
            if not (user.is_superuser or (hasattr(user, 'has_role') and user.has_role('admin'))):
                user_division = getattr(user, 'division', None)
                if user_division and int(division_id) != user_division.id:
                    raise PermissionDenied('Нет доступа к запрашиваемому подразделению')
                    
            queryset = queryset.filter(division_id=division_id)
            
        return queryset


class FacilityViewSet(BaseViewSetMixin, DivisionAccessMixin, viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        # Сначала получаем queryset из DivisionAccessMixin
        queryset = super().get_queryset()
        
        # ЯВНАЯ ФИЛЬТРАЦИЯ для ролей эксплуатации - ВАЖНО!
        user = self.request.user
        if ((hasattr(user, 'has_role') and 
             (user.has_role('exploitation_chief') or user.has_role('exploitation_employee')))):
            user_division = getattr(user, 'division', None)
            if user_division:
                queryset = queryset.filter(division=user_division)
        
        # Дополнительные фильтры
        subdivision = self.request.query_params.get('subdivision', None)
        facility_type = self.request.query_params.get('type', None)
        facility_class = self.request.query_params.get('class', None)
        search = self.request.query_params.get('search', None)
        is_closed = self.request.query_params.get('is_closed')

        if subdivision:
            queryset = queryset.filter(subdivision=subdivision)
        if facility_type:
            queryset = queryset.filter(type=facility_type)
        if facility_class:
            queryset = queryset.filter(facility_class=facility_class)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(street__icontains=search) |
                Q(house_number__icontains=search) |
                Q(address__icontains=search)
            )

        if is_closed in ['true', 'false']:
            queryset = queryset.filter(is_closed=is_closed == 'true')

        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        division = serializer.validated_data.get('division')
        
        # Проверяем, может ли пользователь создавать объекты в этом подразделении
        if not (user.is_superuser or (hasattr(user, 'has_role') and user.has_role('admin'))):
            user_division = getattr(user, 'division', None)
            if user_division and division != user_division:
                raise PermissionDenied('Вы можете создавать объекты только в своем подразделении')
                
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        division = serializer.validated_data.get('division')
        
        # Проверяем, может ли пользователь изменять объекты в этом подразделении
        if not (user.is_superuser or (hasattr(user, 'has_role') and user.has_role('admin'))):
            user_division = getattr(user, 'division', None)
            if user_division and division != user_division:
                raise PermissionDenied('Вы можете изменять объекты только в своем подразделении')
                
        serializer.save()

    # Дополнительная проверка при получении объекта
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Дополнительная проверка для ролей эксплуатации
        if ((hasattr(user, 'has_role') and 
             (user.has_role('exploitation_chief') or user.has_role('exploitation_employee')))):
            user_division = getattr(user, 'division', None)
            if user_division and obj.division and user_division.id != obj.division.id:
                raise PermissionDenied('Нет доступа к этому объекту')
                
        return obj

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'by_type': dict(queryset.values('type').annotate(count=Count('id')).values_list('type', 'count')),
            'by_class': dict(queryset.values('facility_class').annotate(count=Count('id')).values_list('facility_class', 'count')),
            'by_division': dict(queryset.values('division__name').annotate(count=Count('id')).values_list('division__name', 'count'))
        }
        serializer = FacilityStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def comments(self, request, pk=None):
        self.check_view_only_restrictions()
        facility = self.get_object()
        facility.comments = request.data.get('comments', '')
        facility.save()
        serializer = self.get_serializer(facility)
        return Response(serializer.data)


class CommunicationPostViewSet(BaseViewSetMixin, DivisionAccessMixin, viewsets.ModelViewSet):
    queryset = CommunicationPost.objects.all()
    serializer_class = CommunicationPostSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = super().get_queryset().order_by('name')
        
        # ЯВНАЯ ФИЛЬТРАЦИЯ для ролей эксплуатации
        user = self.request.user
        if ((hasattr(user, 'has_role') and 
             (user.has_role('exploitation_chief') or user.has_role('exploitation_employee')))):
            user_division = getattr(user, 'division', None)
            if user_division:
                queryset = queryset.filter(division=user_division)
        
        # Дополнительные фильтры
        division = self.request.query_params.get('division')
        facility_id = self.request.query_params.get('facility')

        if division:
            queryset = queryset.filter(division_id=division)
        
        if facility_id:
            try:
                facility = Facility.objects.get(id=facility_id)
                # Проверяем доступ к facility
                user = self.request.user
                if not (user.is_superuser or (hasattr(user, 'has_role') and user.has_role('admin'))):
                    user_division = getattr(user, 'division', None)
                    if user_division and facility.division != user_division:
                        raise PermissionDenied('Нет доступа к этому объекту')
                queryset = queryset.filter(division=facility.division)
            except Facility.DoesNotExist:
                pass
        
        return queryset

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Дополнительная проверка для ролей эксплуатации
        if ((hasattr(user, 'has_role') and 
             (user.has_role('exploitation_chief') or user.has_role('exploitation_employee')))):
            user_division = getattr(user, 'division', None)
            if user_division and obj.division and user_division.id != obj.division.id:
                raise PermissionDenied('Нет доступа к этому объекту')
                
        return obj


class FacilityTypeViewSet(BaseViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilityType.objects.all()
    serializer_class = FacilityTypeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
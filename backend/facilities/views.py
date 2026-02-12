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
from users.permissions import RoleBasedPermission 
from rest_framework.exceptions import PermissionDenied
from users.logging import log_facility_create, log_facility_update, log_facility_delete, log_facility_view

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
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            instance = Division.objects.get(id=response.data['id'])
            log_facility_create(request.user, instance, request=request, details={'data': response.data})
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = DivisionSerializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            log_facility_update(request.user, instance, request=request, old_data=old_data,
                               details={'changed_fields': self._get_changed_fields(old_data, response.data)})
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        div_data = DivisionSerializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            log_facility_delete(request.user, instance, request=request, details={'deleted_data': div_data})
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_facility_view(request.user, instance, request=request)
        return response

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
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            instance = Subdivision.objects.get(id=response.data['id'])   # ✅
            log_facility_create(request.user, instance, request=request, details={'data': response.data})
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = SubdivisionSerializer(instance).data   # ✅
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            log_facility_update(request.user, instance, request=request, old_data=old_data,
                               details={'changed_fields': self._get_changed_fields(old_data, response.data)})
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        subdiv_data = SubdivisionSerializer(instance).data   # ✅
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            log_facility_delete(request.user, instance, request=request, details={'deleted_data': subdiv_data})
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_facility_view(request.user, instance, request=request)
        return response


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
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            try:
                instance = Facility.objects.get(id=response.data['id'])
                log_facility_create(
                    user=request.user,
                    instance=instance,
                    request=request,
                    details={'data': response.data}
                )
            except Facility.DoesNotExist:
                pass
        return response
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = FacilitySerializer(instance).data  # или просто сериализовать
        
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_facility_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        facility_data = FacilitySerializer(instance).data
        
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_facility_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': facility_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_facility_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response

    @action(detail=True, methods=['patch'])
    def comments(self, request, pk=None):
        self.check_view_only_restrictions()
        facility = self.get_object()
        old_comments = facility.comments
        new_comments = request.data.get('comments', '')
        facility.comments = new_comments
        facility.save()
        log_facility_update(
            user=request.user,
            instance=facility,
            request=request,
            details={
                'field': 'comments',
                'old_value': old_comments,
                'new_value': new_comments
            }
        )
        serializer = self.get_serializer(facility)
        return Response(serializer.data)
    
    def _get_changed_fields(self, old_data, new_data):
        """Вспомогательный метод для определения изменённых полей"""
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {
                    'old': old_data[key],
                    'new': new_data[key]
                }
        return changed


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
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            instance = CommunicationPost.objects.get(id=response.data['id'])
            log_facility_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = CommunicationPostSerializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            log_facility_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        post_data = CommunicationPostSerializer(instance).data   # ✅ исправлено
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            log_facility_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': post_data}            # ✅ исправлено
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_facility_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class FacilityTypeViewSet(BaseViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilityType.objects.all()
    serializer_class = FacilityTypeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            instance = FacilityType.objects.get(id=response.data['id'])
            log_facility_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = FacilityTypeSerializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            log_facility_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        type_data = FacilityTypeSerializer(instance).data      # ✅ исправлено
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == 204:
            log_facility_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': type_data}           # ✅ исправлено
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_facility_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response
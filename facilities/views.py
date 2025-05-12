from django.forms import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import CommunicationPost, Division, Subdivision, Facility
from .serializers import CommunicationPostSerializer, DivisionSerializer, SubdivisionSerializer, FacilitySerializer, FacilityStatsSerializer

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all().prefetch_related(
        'subdivisions',
        'facilities' 
    )
    serializer_class = DivisionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        division = self.get_object()
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
            'subdivisions': SubdivisionSerializer(division.subdivisions.all(), many=True).data,
            'facilities': FacilitySerializer(division.facilities.all(), many=True).data
        })

class SubdivisionViewSet(viewsets.ModelViewSet):
    queryset = Subdivision.objects.all()
    serializer_class = SubdivisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        division_id = self.request.query_params.get('division')
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        return queryset

class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Facility.objects.all()
        division = self.request.query_params.get('division', None)
        subdivision = self.request.query_params.get('subdivision', None)
        facility_type = self.request.query_params.get('type', None)
        facility_class = self.request.query_params.get('class', None)
        search = self.request.query_params.get('search', None)
        is_closed = self.request.query_params.get('is_closed')

        if division:
            queryset = queryset.filter(division=division)
        if subdivision:
            queryset = queryset.filter(subdivision=subdivision)
        if facility_type:
            queryset = queryset.filter(type=facility_type)
        if facility_class:
            queryset = queryset.filter(facility_class=facility_class)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search)
            )

        if is_closed in ['true', 'false']:
            queryset = queryset.filter(is_closed=is_closed == 'true')

        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        # Обновляем посты связи после сохранения
        if 'communication_posts' in self.request.data:
            post_ids = self.request.data.getlist('communication_posts') if hasattr(self.request.data, 'getlist') else self.request.data.get('communication_posts', [])
            instance.communication_posts.set(post_ids)
        
        # Валидация полей
        self.validate_facility_fields(instance)

    # def perform_update(self, serializer):
    #     instance = serializer.save()
    #     # Обновляем посты связи после сохранения
    #     if 'communication_posts' in self.request.data:
    #         post_ids = self.request.data.getlist('communication_posts') if hasattr(self.request.data, 'getlist') else self.request.data.get('communication_posts', [])
    #         instance.communication_posts.set(post_ids)
        
    #     # Валидация полей
    #     self.validate_facility_fields(instance)

    # def validate_facility_fields(self, facility):
    #     if not facility.is_closed and not facility.communication_posts.exists():
    #         raise ValidationError(
    #             {'communication_posts': 'Для открытого объекта необходимо указать посты связи'}
    #         )
    #     if facility.is_closed and not facility.inn:
    #         raise ValidationError(
    #             {'inn': 'Для закрытого объекта необходимо указать ИНН'}
    #         )

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
        facility = self.get_object()
        facility.comments = request.data.get('comments', '')
        facility.save()
        serializer = self.get_serializer(facility)
        return Response(serializer.data)

class CommunicationPostViewSet(viewsets.ModelViewSet):
    queryset = CommunicationPost.objects.all()
    serializer_class = CommunicationPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        facility_id = self.request.query_params.get('facility')
        
        if facility_id:
            try:
                facility = Facility.objects.get(id=facility_id)
                queryset = queryset.filter(division=facility.division)
                if facility.subdivision:
                    queryset = queryset.filter(subdivision=facility.subdivision)
            except Facility.DoesNotExist:
                pass
        return queryset
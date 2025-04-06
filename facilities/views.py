from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import Division, Subdivision, Facility
from .serializers import DivisionSerializer, SubdivisionSerializer, FacilitySerializer, FacilityStatsSerializer

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all().prefetch_related('subdivisions')
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
            'civilian_count': division.get_civilian_count()
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

        return queryset

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
from rest_framework import viewsets
from .models import CommunicationNetwork
from .serializers import CommunicationNetworkSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

class CommunicationNetworkViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CommunicationNetwork.objects.all().prefetch_related(
        'divisions', 'subdivisions', 'facilities', 'equipment'
    )
    serializer_class = CommunicationNetworkSerializer
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'network_class': ['exact'],
        'security_level': ['exact'],
        'protocol': ['exact'],
        'ip_range': ['icontains'],
        'throughput': ['gte', 'lte'],
    }
    search_fields = ['name', 'description', 'ip_range']
    ordering_fields = ['name', 'network_class', 'security_level', 'throughput']
    ordering = ['name']
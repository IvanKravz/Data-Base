# filters.py
import django_filters
from .models import StorageFile, StorageFolder

class StorageFileFilter(django_filters.FilterSet):
    min_size = django_filters.NumberFilter(field_name='size', lookup_expr='gte')
    max_size = django_filters.NumberFilter(field_name='size', lookup_expr='lte')
    uploaded_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    uploaded_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    mime_type_contains = django_filters.CharFilter(field_name='mime_type', lookup_expr='icontains')
    
    class Meta:
        model = StorageFile
        fields = {
            'name': ['icontains'],
            'mime_type': ['exact'],
            'extension': ['exact'],
            'file_type': ['exact'],
            'division': ['exact'],
            'subdivision': ['exact'],
            'is_pinned': ['exact'],
        }

class StorageFolderFilter(django_filters.FilterSet):
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = StorageFolder
        fields = {
            'name': ['icontains'],
            'folder_type': ['exact'],
            'division': ['exact'],
            'subdivision': ['exact'],
            'is_pinned': ['exact'],
        }
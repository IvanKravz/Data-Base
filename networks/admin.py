from django.contrib import admin
from .models import CommunicationNetwork
from facilities.models import Division, Subdivision, Facility
from equipment.models import Equipment

class CommunicationNetworkAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'network_class', 
        'security_level',
        'protocol',
        'ip_range',
    )
    list_filter = (
        'network_class',
        'security_level',
        'protocol'
    )
    search_fields = ('name', 'ip_range', 'description')
    filter_horizontal = ('divisions', 'subdivisions', 'facilities', 'equipment')
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'name',
                'description',
                'network_class',
                'security_level'
            )
        }),
        ('Технические параметры', {
            'fields': (
                'protocol',
                'ip_range',
                'throughput'
            )
        }),
        ('Связанные объекты', {
            'fields': (
                'divisions',
                'subdivisions',
                'facilities',
                'equipment'
            )
        }),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        if obj:  # Только при редактировании существующего объекта
            # Фильтрация подразделений
            form.base_fields['subdivisions'].queryset = Subdivision.objects.filter(
                division__in=obj.divisions.all()
            )
            
            # Фильтрация объектов
            form.base_fields['facilities'].queryset = Facility.objects.filter(
                subdivision__in=obj.subdivisions.all()
            )
            
            # Фильтрация техники
            form.base_fields['equipment'].queryset = Equipment.objects.filter(
                facility__in=obj.facilities.all()
            )
            
        return form

admin.site.register(CommunicationNetwork, CommunicationNetworkAdmin)
from django.contrib import admin
from django.utils.html import format_html
from .models import ACL, CommunicationNetwork, VLAN, NetworkDirection, NetworkInterface, IPAddress, IPRange, RoutingTable, VLANConfiguration, NetworkMembership
from facilities.models import Division, Subdivision, Facility
from equipment.models import Equipment

class NetworkMembershipInline(admin.TabularInline):
    model = NetworkMembership
    extra = 1
    raw_id_fields = ['division', 'facility', 'equipment']

class CommunicationNetworkAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'get_memberships_count',
        'network_class', 
        'security_level',
        'protocol',
        'ip_range',
        'throughput'
    ]
    list_filter = [
        'network_class', 
        'security_level',
        'protocol',
    ]
    search_fields = [
        'name', 
        'description',
        'ip_range'
    ]
    inlines = [NetworkMembershipInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'name', 'description', 'network_class', 'security_level'
            )
        }),
        ('Технические параметры', {
            'fields': (
                'ip_range', 'throughput', 'protocol'
            )
        }),
    )
    
    def get_memberships_count(self, obj):
        return obj.memberships.count()
    get_memberships_count.short_description = 'Количество связей'

class VLANAdmin(admin.ModelAdmin):
    list_display = ['vlan_id', 'name', 'description']
    list_filter = ['vlan_id']
    search_fields = ['name', 'description', 'vlan_id']

class VLANConfigurationAdmin(admin.ModelAdmin):
    list_display = ['interface', 'vlan', 'is_tagged', 'priority']
    list_filter = ['is_tagged', 'vlan']
    raw_id_fields = ['interface', 'vlan']

class NetworkInterfaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'equipment', 'interface_type', 'enabled', 'get_access_vlan')
    list_filter = ('interface_type', 'enabled', 'equipment')
    search_fields = ('name', 'equipment__name', 'mac_address')
    raw_id_fields = ('equipment', 'native_vlan', 'connected_to')
    
    def get_access_vlan(self, obj):
        return obj.access_vlan.vlan_id if obj.access_vlan else None
    get_access_vlan.short_description = 'Access VLAN'

class IPAddressAdmin(admin.ModelAdmin):
    list_display = ['address', 'netmask', 'interface', 'version', 'is_primary']
    list_filter = ['version', 'is_primary']
    search_fields = ['address', 'gateway']
    raw_id_fields = ['interface']

class IPRangeAdmin(admin.ModelAdmin):
    list_display = ('network', 'description', 'get_vlan', 'get_devices_count')
    list_filter = ('vlan',)
    search_fields = ('network', 'description')
    filter_horizontal = ('devices',)
    raw_id_fields = ('vlan',)
    
    def get_vlan(self, obj):
        return obj.vlan.vlan_id if obj.vlan else None
    get_vlan.short_description = 'VLAN'
    
    def get_devices_count(self, obj):
        return obj.devices.count()
    get_devices_count.short_description = 'Количество устройств'

class RoutingTableAdmin(admin.ModelAdmin):
    list_display = ['equipment', 'network', 'netmask', 'gateway', 'interface', 'metric']
    list_filter = ['equipment']
    search_fields = ['network', 'gateway']
    raw_id_fields = ['equipment', 'interface']

class ACLAdmin(admin.ModelAdmin):
    list_display = ['equipment', 'name', 'sequence', 'action', 'protocol']
    list_filter = ['equipment', 'action', 'protocol']
    search_fields = ['name', 'source_network', 'destination_network']
    raw_id_fields = ['equipment']
    ordering = ['equipment', 'name', 'sequence']

class NetworkMembershipAdmin(admin.ModelAdmin):
    list_display = ['network', 'division', 'facility', 'equipment']
    list_filter = ['network', 'division', 'facility']
    search_fields = ['network__name', 'division__name', 'facility__name', 'equipment__name']
    raw_id_fields = ['network', 'division', 'facility', 'equipment']


class NetworkDirectionAdmin(admin.ModelAdmin):
    list_display = ['network', 'get_from_membership', 'get_to_membership', 'bandwidth', 'latency']
    list_filter = ['network']
    search_fields = [
        'network__name',
        'from_membership__division__name',
        'from_membership__facility__name',
        'to_membership__division__name',
        'to_membership__facility__name'
    ]
    raw_id_fields = ['network', 'from_membership', 'to_membership']
    
    def get_from_membership(self, obj):
        return f"{obj.from_membership.division.name} - {obj.from_membership.facility.name}"
    get_from_membership.short_description = 'Откуда'
    
    def get_to_membership(self, obj):
        return f"{obj.to_membership.division.name} - {obj.to_membership.facility.name}"
    get_to_membership.short_description = 'Куда'



# Регистрация моделей
admin.site.register(CommunicationNetwork, CommunicationNetworkAdmin)
admin.site.register(NetworkMembership, NetworkMembershipAdmin)
admin.site.register(VLAN, VLANAdmin)
admin.site.register(VLANConfiguration, VLANConfigurationAdmin)
admin.site.register(NetworkInterface, NetworkInterfaceAdmin)
admin.site.register(IPAddress, IPAddressAdmin)
admin.site.register(IPRange, IPRangeAdmin)
admin.site.register(RoutingTable, RoutingTableAdmin)
admin.site.register(ACL, ACLAdmin)
admin.site.register(NetworkDirection, NetworkDirectionAdmin)
from django.contrib import admin

from equipment.models import Equipment  # noqa: F401 (нужен для raw_id_fields)
from facilities.models import Division, Facility, Subdivision  # noqa: F401

from .models import (
    ACL,
    CommunicationNetwork,
    IPAddress,
    NetworkDirection,
    NetworkInterface,
    NetworkMembership,
    RoutingTable,
    Subnet,
    VLAN,
    VLANConfiguration,
)


# ============================================================================
# Inlines
# ============================================================================

class NetworkMembershipInline(admin.TabularInline):
    model = NetworkMembership
    extra = 1
    raw_id_fields = ['division', 'facility', 'equipment']


class SubnetInline(admin.TabularInline):
    model = Subnet
    extra = 0
    fields = ('network_address', 'prefix_length', 'vlan', 'purpose', 'gateway')
    raw_id_fields = ('vlan', 'parent')
    show_change_link = True


# ============================================================================
# Сеть связи
# ============================================================================

@admin.register(CommunicationNetwork)
class CommunicationNetworkAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'get_memberships_count',
        'get_subnets_count',
        'network_class',
        'security_level',
        'protocol',
        'ip_range',
        'throughput',
    ]
    list_filter = ['network_class', 'security_level', 'protocol']
    search_fields = ['name', 'description', 'ip_range']
    inlines = [NetworkMembershipInline, SubnetInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'network_class', 'security_level'),
        }),
        ('Технические параметры', {
            'fields': ('ip_range', 'throughput', 'protocol'),
        }),
    )

    def get_memberships_count(self, obj):
        return obj.memberships.count()
    get_memberships_count.short_description = 'Привязок'

    def get_subnets_count(self, obj):
        return obj.subnets.count()
    get_subnets_count.short_description = 'Подсетей'


# ============================================================================
# VLAN
# ============================================================================

@admin.register(VLAN)
class VLANAdmin(admin.ModelAdmin):
    list_display = ['vlan_id', 'name', 'description']
    list_filter = ['vlan_id']
    search_fields = ['name', 'description', 'vlan_id']


@admin.register(VLANConfiguration)
class VLANConfigurationAdmin(admin.ModelAdmin):
    list_display = ['interface', 'vlan', 'is_tagged', 'priority']
    list_filter = ['is_tagged', 'vlan']
    raw_id_fields = ['interface', 'vlan']


# ============================================================================
# Сетевой интерфейс
# ============================================================================

@admin.register(NetworkInterface)
class NetworkInterfaceAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'equipment', 'interface_type', 'enabled', 'get_access_vlan',
    )
    list_filter = ('interface_type', 'enabled', 'equipment')
    search_fields = ('name', 'equipment__name', 'mac_address')
    raw_id_fields = ('equipment', 'access_vlan', 'native_vlan', 'connected_to')

    def get_access_vlan(self, obj):
        return obj.access_vlan.vlan_id if obj.access_vlan else None
    get_access_vlan.short_description = 'Access VLAN'


# ============================================================================
# Подсеть (новое)
# ============================================================================

@admin.register(Subnet)
class SubnetAdmin(admin.ModelAdmin):
    list_display = (
        'cidr', 'get_netmask', 'network', 'vlan',
        'purpose', 'gateway',
        'get_used_count', 'host_count', 'parent',
    )
    list_filter = ('network', 'vlan', 'prefix_length', 'dhcp_enabled')
    search_fields = ('network_address', 'purpose', 'description')
    raw_id_fields = ('network', 'vlan', 'parent')
    readonly_fields = (
        'cidr', 'netmask', 'broadcast', 'first_host', 'last_host', 'host_count',
        'created_at', 'updated_at',
    )

    fieldsets = (
        ('Подсеть', {
            'fields': ('network', 'parent', 'network_address', 'prefix_length'),
        }),
        ('Вычисляемые параметры', {
            'fields': (
                'cidr', 'netmask', 'broadcast',
                'first_host', 'last_host', 'host_count',
            ),
        }),
        ('Настройки', {
            'fields': ('vlan', 'purpose', 'gateway', 'description'),
        }),
        ('DHCP', {
            'fields': ('dhcp_enabled', 'dhcp_pool_start', 'dhcp_pool_end'),
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_netmask(self, obj):
        return obj.netmask
    get_netmask.short_description = 'Маска'

    def get_used_count(self, obj):
        return obj.ip_addresses.exclude(status='free').count()
    get_used_count.short_description = 'Занято'


# ============================================================================
# IP-адрес
# ============================================================================

@admin.register(IPAddress)
class IPAddressAdmin(admin.ModelAdmin):
    list_display = (
        'address', 'subnet', 'status',
        'hostname', 'assigned_to', 'interface', 'is_primary',
    )
    list_filter = ('status', 'subnet', 'is_primary')
    search_fields = ('address', 'hostname', 'purpose', 'assigned_to')
    raw_id_fields = ('subnet', 'interface')
    list_select_related = ('subnet', 'interface', 'interface__equipment')


# ============================================================================
# Маршруты и ACL
# ============================================================================

@admin.register(RoutingTable)
class RoutingTableAdmin(admin.ModelAdmin):
    list_display = [
        'equipment', 'network', 'netmask', 'gateway', 'interface', 'metric',
    ]
    list_filter = ['equipment']
    search_fields = ['network', 'gateway']
    raw_id_fields = ['equipment', 'interface']


@admin.register(ACL)
class ACLAdmin(admin.ModelAdmin):
    list_display = ['equipment', 'name', 'sequence', 'action', 'protocol']
    list_filter = ['equipment', 'action', 'protocol']
    search_fields = ['name', 'source_network', 'destination_network']
    raw_id_fields = ['equipment']
    ordering = ['equipment', 'name', 'sequence']


# ============================================================================
# Членство и направления
# ============================================================================

@admin.register(NetworkMembership)
class NetworkMembershipAdmin(admin.ModelAdmin):
    list_display = ['network', 'division', 'facility', 'equipment']
    list_filter = ['network', 'division', 'facility']
    search_fields = [
        'network__name', 'division__name', 'facility__name', 'equipment__name',
    ]
    raw_id_fields = ['network', 'division', 'facility', 'equipment']


@admin.register(NetworkDirection)
class NetworkDirectionAdmin(admin.ModelAdmin):
    list_display = [
        'network', 'get_from_membership', 'get_to_membership', 'bandwidth', 'latency',
    ]
    list_filter = ['network']
    search_fields = [
        'network__name',
        'from_membership__division__name',
        'from_membership__facility__name',
        'to_membership__division__name',
        'to_membership__facility__name',
    ]
    raw_id_fields = ['network', 'from_membership', 'to_membership']

    def get_from_membership(self, obj):
        return f"{obj.from_membership.division.name} — {obj.from_membership.facility.name}"
    get_from_membership.short_description = 'Откуда'

    def get_to_membership(self, obj):
        return f"{obj.to_membership.division.name} — {obj.to_membership.facility.name}"
    get_to_membership.short_description = 'Куда'
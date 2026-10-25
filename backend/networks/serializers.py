import ipaddress  # noqa: F401  (оставлен для совместимости с прошлыми импортами)

from rest_framework import serializers

from equipment.models import Equipment
from equipment.serializers import EquipmentSerializer
from facilities.models import Division, Facility
from facilities.serializers import DivisionSerializer, FacilitySerializer

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
# Подсети
# ============================================================================

class SubnetSerializer(serializers.ModelSerializer):
    cidr            = serializers.ReadOnlyField()
    netmask         = serializers.ReadOnlyField()
    broadcast       = serializers.ReadOnlyField()
    first_host      = serializers.ReadOnlyField()
    last_host       = serializers.ReadOnlyField()
    host_count      = serializers.ReadOnlyField()

    used_count      = serializers.SerializerMethodField()
    reserved_count  = serializers.SerializerMethodField()
    free_count      = serializers.SerializerMethodField()
    children_count  = serializers.SerializerMethodField()

    vlan_name       = serializers.CharField(source='vlan.name', read_only=True, allow_null=True)
    vlan_id_num     = serializers.IntegerField(source='vlan.vlan_id', read_only=True, allow_null=True)
    network_name    = serializers.CharField(source='network.name', read_only=True)

    class Meta:
        model = Subnet
        fields = [
            'id', 'network', 'network_name', 'vlan', 'vlan_name', 'vlan_id_num',
            'parent',
            'network_address', 'prefix_length',
            'cidr', 'netmask', 'broadcast', 'first_host', 'last_host', 'host_count',
            'used_count', 'reserved_count', 'free_count', 'children_count',
            'purpose', 'gateway', 'description',
            'dhcp_enabled', 'dhcp_pool_start', 'dhcp_pool_end',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['parent', 'created_at', 'updated_at']

    def get_used_count(self, obj):
        return obj.ip_addresses.exclude(status='free').count()

    def get_reserved_count(self, obj):
        return obj.ip_addresses.filter(status='reserved').count()

    def get_free_count(self, obj):
        used = obj.ip_addresses.exclude(status='free').count()
        return max(obj.host_count - used, 0)

    def get_children_count(self, obj):
        return obj.children.count()

    def validate(self, attrs):
        instance = Subnet(**{
            **{
                k: getattr(self.instance, k) if self.instance else None
                for k in [
                    'network', 'vlan', 'network_address', 'prefix_length',
                    'parent', 'gateway', 'dhcp_enabled',
                    'dhcp_pool_start', 'dhcp_pool_end',
                ]
            },
            **attrs,
        })
        if self.instance:
            instance.pk = self.instance.pk
            instance._state.adding = False

        instance.clean()
        return attrs


# ============================================================================
# IP-адреса
# ============================================================================

class IPAddressSerializer(serializers.ModelSerializer):
    interface_name = serializers.CharField(
        source='interface.name', read_only=True, allow_null=True,
    )
    equipment_id = serializers.IntegerField(
        source='interface.equipment.id', read_only=True, allow_null=True,
    )
    equipment_name = serializers.CharField(
        source='interface.equipment.name', read_only=True, allow_null=True,
    )
    subnet_cidr = serializers.CharField(source='subnet.cidr', read_only=True)
    network_id = serializers.IntegerField(source='subnet.network.id', read_only=True)

    class Meta:
        model = IPAddress
        fields = [
            'id', 'subnet', 'subnet_cidr', 'network_id',
            'interface', 'interface_name', 'equipment_id', 'equipment_name',
            'address', 'status', 'is_primary',
            'hostname', 'purpose', 'assigned_to', 'description',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        instance = IPAddress(**{
            **{
                k: getattr(self.instance, k) if self.instance else None
                for k in ['subnet', 'address', 'status', 'interface', 'assigned_to']
            },
            **attrs,
        })
        if self.instance:
            instance.pk = self.instance.pk
            instance._state.adding = False
        instance.clean()
        return attrs


# ============================================================================
# Членство сети
# ============================================================================

class NetworkMembershipSerializer(serializers.ModelSerializer):
    division = DivisionSerializer(read_only=True)
    facility = FacilitySerializer(read_only=True)
    equipment = EquipmentSerializer(read_only=True)

    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(), source='division', write_only=True,
    )
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(), source='facility', write_only=True,
    )
    equipment_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(), source='equipment', write_only=True,
    )

    class Meta:
        model = NetworkMembership
        fields = [
            'id', 'network',
            'division', 'facility', 'equipment',
            'division_id', 'facility_id', 'equipment_id',
        ]

    def validate(self, attrs):
        division = attrs.get('division') or getattr(self.instance, 'division', None)
        facility = attrs.get('facility') or getattr(self.instance, 'facility', None)
        equipment = attrs.get('equipment') or getattr(self.instance, 'equipment', None)

        errors = {}
        if division and facility and facility.division_id != division.id:
            errors['facility_id'] = 'Объект не принадлежит указанному подразделению'
        if facility and equipment and equipment.facility_id != facility.id:
            errors['equipment_id'] = 'Оборудование не принадлежит указанному объекту'
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


# ============================================================================
# Направления
# ============================================================================

class NetworkDirectionSerializer(serializers.ModelSerializer):
    from_membership_details = NetworkMembershipSerializer(
        source='from_membership', read_only=True,
    )
    to_membership_details = NetworkMembershipSerializer(
        source='to_membership', read_only=True,
    )

    class Meta:
        model = NetworkDirection
        fields = [
            'id', 'network',
            'from_membership', 'to_membership',
            'from_membership_details', 'to_membership_details',
            'bandwidth', 'latency', 'description', 'created_at',
        ]

    def validate(self, attrs):
        network = attrs.get('network') or getattr(self.instance, 'network', None)
        from_m = attrs.get('from_membership') or getattr(self.instance, 'from_membership', None)
        to_m = attrs.get('to_membership') or getattr(self.instance, 'to_membership', None)

        errors = {}
        if from_m and to_m and from_m.id == to_m.id:
            errors['to_membership'] = 'Источник и назначение не могут совпадать'
        if network and from_m and from_m.network_id != network.id:
            errors['from_membership'] = 'Источник принадлежит другой сети'
        if network and to_m and to_m.network_id != network.id:
            errors['to_membership'] = 'Назначение принадлежит другой сети'
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class NetworkDirectionBulkCreateSerializer(serializers.Serializer):
    network = serializers.PrimaryKeyRelatedField(
        queryset=CommunicationNetwork.objects.all(),
    )
    directions = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        from django.db import transaction

        network = validated_data['network']
        directions_data = validated_data['directions']

        membership_ids = set()
        for d in directions_data:
            membership_ids.add(d['from_membership'])
            membership_ids.add(d['to_membership'])

        memberships = NetworkMembership.objects.filter(id__in=membership_ids)
        membership_dict = {m.id: m for m in memberships}

        for d in directions_data:
            f = membership_dict.get(d['from_membership'])
            t = membership_dict.get(d['to_membership'])
            if not f or not t:
                raise serializers.ValidationError(
                    f"Не найдено членство: {d['from_membership']} или "
                    f"{d['to_membership']}"
                )
            if f.network_id != network.id or t.network_id != network.id:
                raise serializers.ValidationError(
                    f"Членство не принадлежит сети {network.id}"
                )
            if f.id == t.id:
                raise serializers.ValidationError(
                    f"Источник и назначение совпадают (id={f.id})"
                )

        created = []
        with transaction.atomic():
            NetworkDirection.objects.filter(network=network).delete()
            for d in directions_data:
                created.append(NetworkDirection.objects.create(
                    network=network,
                    from_membership=membership_dict[d['from_membership']],
                    to_membership=membership_dict[d['to_membership']],
                    bandwidth=d.get('bandwidth'),
                    latency=d.get('latency'),
                    description=d.get('description', ''),
                ))
        return created

    def to_representation(self, instance):
        return NetworkDirectionSerializer(instance, many=True).data


# ============================================================================
# Сеть связи
# ============================================================================

class CommunicationNetworkSerializer(serializers.ModelSerializer):
    memberships = NetworkMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = CommunicationNetwork
        fields = [
            'id', 'name', 'description', 'network_class', 'security_level',
            'ip_range', 'throughput', 'protocol',
            'created_at', 'updated_at',
            'memberships',
        ]


# ============================================================================
# VLAN, интерфейсы, IP, маршруты, ACL
# ============================================================================

class VLANSerializer(serializers.ModelSerializer):
    class Meta:
        model = VLAN
        fields = '__all__'


class VLANConfigurationSerializer(serializers.ModelSerializer):
    vlan_name = serializers.CharField(source='vlan.name', read_only=True)

    class Meta:
        model = VLANConfiguration
        fields = '__all__'


class NetworkInterfaceSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    access_vlan_name = serializers.CharField(
        source='access_vlan.name', read_only=True, allow_null=True,
    )
    native_vlan_name = serializers.CharField(
        source='native_vlan.name', read_only=True, allow_null=True,
    )
    connected_to_name = serializers.CharField(
        source='connected_to.name', read_only=True, allow_null=True,
    )
    connected_to_equipment_name = serializers.CharField(
        source='connected_to.equipment.name', read_only=True, allow_null=True,
    )
    vlan_configurations = VLANConfigurationSerializer(many=True, read_only=True)
    ip_addresses = serializers.SerializerMethodField()

    class Meta:
        model = NetworkInterface
        fields = [
            'id', 'equipment', 'equipment_name',
            'name', 'interface_type', 'physical_type',
            'port_number', 'slot', 'module', 'enabled',
            'mode', 'mac_address', 'mtu', 'speed',
            'access_vlan', 'access_vlan_name',
            'is_trunk', 'native_vlan', 'native_vlan_name',
            'connected_to', 'connected_to_name', 'connected_to_equipment_name',
            'vlan_configurations', 'ip_addresses',
        ]

    def get_ip_addresses(self, obj):
        return IPAddressSerializer(obj.ip_addresses.all(), many=True).data


class RoutingTableSerializer(serializers.ModelSerializer):
    interface_name = serializers.CharField(
        source='interface.name', read_only=True, allow_null=True,
    )

    class Meta:
        model = RoutingTable
        fields = '__all__'


class ACLSerializer(serializers.ModelSerializer):
    class Meta:
        model = ACL
        fields = '__all__'
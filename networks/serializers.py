from equipment.models import Equipment
from equipment.serializers import EquipmentSerializer
from facilities.models import Division, Facility
from facilities.serializers import DivisionSerializer, FacilitySerializer, SubdivisionSerializer
from .models import VLAN, CommunicationNetwork, IPAddress, IPRange, NetworkDirection, NetworkInterface, NetworkMembership, VLANConfiguration, RoutingTable, ACL
from rest_framework import serializers

class NetworkMembershipSerializer(serializers.ModelSerializer):
    division = DivisionSerializer(read_only=True)
    facility = FacilitySerializer(read_only=True)
    equipment = EquipmentSerializer(read_only=True)
    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(), 
        source='division', 
        write_only=True
    )
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(), 
        source='facility', 
        write_only=True
    )
    equipment_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(), 
        source='equipment', 
        write_only=True
    )
    
    class Meta:
        model = NetworkMembership
        fields = [
            'id', 'network', 'division', 'facility', 'equipment',
            'division_id', 'facility_id', 'equipment_id'
        ]


class NetworkDirectionSerializer(serializers.ModelSerializer):
    from_membership_details = NetworkMembershipSerializer(source='from_membership', read_only=True)
    to_membership_details = NetworkMembershipSerializer(source='to_membership', read_only=True)
    
    class Meta:
        model = NetworkDirection
        fields = [
            'id', 'network', 'from_membership', 'to_membership',
            'from_membership_details', 'to_membership_details',
            'bandwidth', 'latency', 'description', 'created_at'
        ]


class NetworkDirectionBulkCreateSerializer(serializers.Serializer):
    network = serializers.PrimaryKeyRelatedField(queryset=CommunicationNetwork.objects.all())
    directions = serializers.ListField(child=serializers.DictField())

    def create(self, validated_data):
        network = validated_data['network']
        directions_data = validated_data['directions']
        directions = []
        
        # Удаляем старые направления для этой сети
        NetworkDirection.objects.filter(network=network).delete()
        
        # Предварительно загружаем все необходимые членства
        membership_ids = set()
        for direction_data in directions_data:
            membership_ids.add(direction_data['from_membership'])
            membership_ids.add(direction_data['to_membership'])
        
        memberships = NetworkMembership.objects.filter(id__in=membership_ids)
        membership_dict = {m.id: m for m in memberships}
        
        for direction_data in directions_data:
            # Получаем объекты членств
            from_membership = membership_dict.get(direction_data['from_membership'])
            to_membership = membership_dict.get(direction_data['to_membership'])
            
            if not from_membership or not to_membership:
                raise serializers.ValidationError(
                    f"Не найдено членство с ID: {direction_data['from_membership']} или {direction_data['to_membership']}"
                )
            
            # Создаем каждое направление
            direction = NetworkDirection.objects.create(
                network=network,
                from_membership=from_membership,
                to_membership=to_membership,
                bandwidth=direction_data.get('bandwidth'),
                latency=direction_data.get('latency'),
                description=direction_data.get('description', '')
            )
            directions.append(direction)
        
        return directions

    def to_representation(self, instance):
        return NetworkDirectionSerializer(instance, many=True).data

class CommunicationNetworkSerializer(serializers.ModelSerializer):
    memberships = NetworkMembershipSerializer(many=True, read_only=True)
    
    class Meta:
        model = CommunicationNetwork
        fields = [
            'id', 'name', 'description', 'network_class', 'security_level',
            'ip_range', 'throughput', 'protocol', 'created_at', 'updated_at',
            'memberships'
        ]
    
    def update(self, instance, validated_data):
        # Обновляем основные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

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
    access_vlan_name = serializers.CharField(source='access_vlan.name', read_only=True, allow_null=True)
    native_vlan_name = serializers.CharField(source='native_vlan.name', read_only=True, allow_null=True)
    connected_to_name = serializers.CharField(source='connected_to.name', read_only=True, allow_null=True)
    connected_device_name = serializers.CharField(source='connected_device.name', read_only=True, allow_null=True)
    vlan_configurations = VLANConfigurationSerializer(many=True, read_only=True)
    ip_addresses = serializers.SerializerMethodField()
    
    class Meta:
        model = NetworkInterface
        fields = '__all__'
    
    def get_ip_addresses(self, obj):
        return IPAddressSerializer(obj.ip_addresses.all(), many=True).data

class IPAddressSerializer(serializers.ModelSerializer):
    interface_name = serializers.CharField(source='interface.name', read_only=True)
    equipment_name = serializers.CharField(source='interface.equipment.name', read_only=True)
    
    class Meta:
        model = IPAddress
        fields = '__all__'

class IPRangeSerializer(serializers.ModelSerializer):
    vlan_name = serializers.CharField(source='vlan.name', read_only=True, allow_null=True)
    devices_count = serializers.IntegerField(source='devices.count', read_only=True)
    
    class Meta:
        model = IPRange
        fields = '__all__'

class RoutingTableSerializer(serializers.ModelSerializer):
    interface_name = serializers.CharField(source='interface.name', read_only=True, allow_null=True)
    
    class Meta:
        model = RoutingTable
        fields = '__all__'

class ACLSerializer(serializers.ModelSerializer):
    class Meta:
        model = ACL
        fields = '__all__'
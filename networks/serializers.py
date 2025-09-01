from equipment.serializers import EquipmentSerializer
from facilities.serializers import DivisionSerializer, FacilitySerializer, SubdivisionSerializer
from .models import VLAN, CommunicationNetwork, IPAddress, IPRange, NetworkInterface, VLANConfiguration, RoutingTable, ACL
from rest_framework import serializers


class CommunicationNetworkSerializer(serializers.ModelSerializer):
    divisions = DivisionSerializer(many=True, read_only=True)
    subdivisions = SubdivisionSerializer(many=True, read_only=True)
    facilities = FacilitySerializer(many=True, read_only=True)
    equipment = EquipmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = CommunicationNetwork
        fields = '__all__'

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
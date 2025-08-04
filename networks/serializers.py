from equipment.serializers import EquipmentSerializer
from facilities.serializers import DivisionSerializer, FacilitySerializer, SubdivisionSerializer
from networks.models import CommunicationNetwork
from rest_framework import serializers


class CommunicationNetworkSerializer(serializers.ModelSerializer):
    divisions = DivisionSerializer(many=True, read_only=True)
    subdivisions = SubdivisionSerializer(many=True, read_only=True)
    facilities = FacilitySerializer(many=True, read_only=True)
    equipment = EquipmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = CommunicationNetwork
        fields = '__all__'
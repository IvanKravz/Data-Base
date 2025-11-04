# maps/serializers.py
from rest_framework import serializers
from .models import FSBOffice, RUSSIAN_REGIONS

class FSBOfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FSBOffice
        fields = [
            'id', 'name', 'address', 'region',
            'phone_operator', 'phone_communication', 'fax', 'email',
            'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class FSBOfficeCreateSerializer(FSBOfficeSerializer):
    """Сериализатор для создания"""
    class Meta(FSBOfficeSerializer.Meta):
        read_only_fields = ['id', 'created_at', 'updated_at']

class RegionOfficesSerializer(serializers.Serializer):
    """Сериализатор для группировки офисов по регионам"""
    region = serializers.CharField()
    offices = FSBOfficeSerializer(many=True)
    office_count = serializers.IntegerField()

class RegionSerializer(serializers.Serializer):
    """Сериализатор для списка регионов"""
    name = serializers.CharField()
    office_count = serializers.IntegerField()
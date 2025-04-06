from rest_framework import serializers
from .models import Equipment
from users.serializers import EmployeeSerializer

class EquipmentSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeSerializer(read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    disposal_info = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'type', 'is_closed', 'open_category', 'closed_category', 'category_display',
            'status', 'status_display', 'serial_number', 'inventory_number',
            'manufacturing_date', 'purchase_date', 'division', 'division_name',
            'subdivision', 'facility', 'facility_name', 'assigned_to',
            'comments', 'created_at', 'updated_at', 'disposal_info'
        ]

    def get_category_display(self, obj):
        if obj.is_closed:
            return obj.closed_category.name if obj.closed_category else 'Без категории'
        else:
            return dict(Equipment.OPEN_EQUIPMENT_CATEGORIES).get(obj.open_category, 'Без категории')

    def get_disposal_info(self, obj):
        if obj.status != 'disposed':
            return None
        
        return {
            'actNumber': obj.disposal_act_number,
            'actDate': obj.disposal_act_date,
            'disposalCertNumber': obj.disposal_cert_number,
            'disposalCertDate': obj.disposal_cert_date,
            'comments': obj.disposal_comments
        }

    def update(self, instance, validated_data):
        # Handle disposal info if present in request
        disposal_info = self.context['request'].data.get('disposalInfo')
        if disposal_info and validated_data.get('status') == 'disposed':
            instance.disposal_act_number = disposal_info.get('actNumber')
            instance.disposal_act_date = disposal_info.get('actDate')
            instance.disposal_cert_number = disposal_info.get('disposalCertNumber')
            instance.disposal_cert_date = disposal_info.get('disposalCertDate')
            instance.disposal_comments = disposal_info.get('comments')

        return super().update(instance, validated_data)

class EquipmentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_category = serializers.DictField(child=serializers.IntegerField())
    by_status = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
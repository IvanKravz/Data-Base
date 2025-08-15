from rest_framework import serializers
from facilities.models import Division, Subdivision, Facility
from .models import VLAN, NetworkInterface, IPAddress, IPRange, ClosedEquipmentCategory, Equipment, OpenEquipmentCategory, ProductStructure
from users.serializers import EmployeeSerializer

class DivisionShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name']

class SubdivisionShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdivision
        fields = ['id', 'name']

class FacilityShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['id', 'name']

class OpenEquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenEquipmentCategory
        fields = ['value', 'name']

class ClosedEquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClosedEquipmentCategory
        fields = ['value', 'name']

class ProductStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductStructure
        fields = ['id', 'name', 'model', 'serial_number', 'note']

class VLANSerializer(serializers.ModelSerializer):
    class Meta:
        model = VLAN
        fields = ['id', 'vlan_id', 'name', 'description']

class NetworkInterfaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NetworkInterface
        fields = ['id', 'name', 'interface_type', 'physical_type', 'enabled', 'vlan', 'is_trunk', 'native_vlan']

class IPAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = IPAddress
        fields = ['id', 'address', 'netmask', 'version', 'is_primary', 'gateway']

class IPRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IPRange
        fields = ['id', 'network', 'description', 'vlan', 'devices']

class EquipmentSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeSerializer(read_only=True)
    division = DivisionShortSerializer(read_only=True)
    subdivision = SubdivisionShortSerializer(read_only=True)
    facility = FacilityShortSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    disposal_info = serializers.SerializerMethodField()
    open_category = OpenEquipmentCategorySerializer(read_only=True)
    closed_category = ClosedEquipmentCategorySerializer(read_only=True)
    product_structures = ProductStructureSerializer(many=True, read_only=True)
    first_invoice = serializers.CharField(required=False, allow_null=True)
    material_invoice = serializers.CharField(required=False, allow_null=True)
    ver_software = serializers.CharField(required=False, allow_null=True)
    network_interfaces = serializers.SerializerMethodField()
    ip_ranges = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'type', 'is_closed', 'open_category', 'closed_category', 'category_display',
            'status', 'status_display', 'serial_number', 'inventory_number',
            'first_invoice', 'material_invoice', 'ver_software', 'product_structures',
            'manufacturing_date', 'purchase_date', 'division', 'subdivision', 
            'facility', 'assigned_to', 'comments', 'created_at', 'updated_at', 'disposal_info',
            'network_interfaces', 'ip_ranges'
        ]
        extra_kwargs = {
            'division': {'write_only': True},
            'subdivision': {'write_only': True},
            'facility': {'write_only': True}
        }

    def get_category_display(self, obj):
        return obj.get_category_display()

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
    
    def get_network_interfaces(self, obj):
        """Возвращает сетевые интерфейсы только для сетевого оборудования"""
        if not hasattr(obj, 'is_network_device') or not obj.is_network_device:
            return []
        
        interfaces = obj.network_interfaces.all()
        return NetworkInterfaceSerializer(interfaces, many=True).data

    def get_ip_ranges(self, obj):
        """Возвращает IP диапазоны для оборудования"""
        if not hasattr(obj, 'ip_ranges'):
            return []
        
        ranges = obj.ip_ranges.all()
        return IPRangeSerializer(ranges, many=True).data

    def update(self, instance, validated_data):
        # Получаем данные о составе изделия из запроса
        product_structures_data = self.context['request'].data.get('product_structures', [])
        
        # Обработка полей связей
        division_id = self.context['request'].data.get('division')
        if division_id:
            instance.division_id = division_id
        
        subdivision_id = self.context['request'].data.get('subdivision')
        if subdivision_id:
            instance.subdivision_id = subdivision_id
            
        facility_id = self.context['request'].data.get('facility')
        if facility_id:
            instance.facility_id = facility_id
            
        assigned_to_id = self.context['request'].data.get('assigned_to')
        if assigned_to_id:
            instance.assigned_to_id = assigned_to_id
            
        # Обработка категорий
        if validated_data.get('is_closed'):
            closed_category_value = self.context['request'].data.get('closed_category')
            if closed_category_value:
                instance.closed_category = ClosedEquipmentCategory.objects.get(value=closed_category_value)
            instance.open_category = None
        else:
            open_category_value = self.context['request'].data.get('open_category')
            if open_category_value:
                instance.open_category_id = OpenEquipmentCategory.objects.get(value=open_category_value).id
            instance.closed_category = None
            
        # Обработка состава изделия
        if product_structures_data:
            current_structures = {str(s.id): s for s in instance.product_structures.all()}
            new_structure_ids = []
            
            for structure_data in product_structures_data:
                structure_id = str(structure_data.get('id')) if structure_data.get('id') else None
                
                if structure_id and structure_id in current_structures:
                    # Обновляем существующую структуру
                    structure = current_structures[structure_id]
                    for attr, value in structure_data.items():
                        if attr != 'id':
                            setattr(structure, attr, value)
                    structure.save()
                    new_structure_ids.append(structure_id)
                else:
                    # Создаем новую структуру
                    structure = ProductStructure.objects.create(
                        equipment=instance,
                        name=structure_data.get('name', ''),
                        model=structure_data.get('model'),
                        serial_number=structure_data.get('serial_number'),
                        note=structure_data.get('note')
                    )
                    new_structure_ids.append(str(structure.id))
            
            # Удаляем структуры, которых нет в новых данных
            for structure_id, structure in current_structures.items():
                if structure_id not in new_structure_ids:
                    structure.delete()
            
        # Остальные поля
        for attr, value in validated_data.items():
            if attr not in ['division', 'subdivision', 'facility', 'assigned_to', 'open_category', 'closed_category', 'product_structures']:
                setattr(instance, attr, value)
                
        instance.save()
        return instance

class EquipmentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_category = serializers.DictField(child=serializers.IntegerField())
    by_status = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
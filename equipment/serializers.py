from rest_framework import serializers
from facilities.models import Division, Subdivision, Facility
from .models import EquipmentCategory, Equipment, ProductStructure
from users.serializers import EmployeeSerializer
from django.apps import apps

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

class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = ['value', 'name', 'is_closed']

class ProductStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductStructure
        fields = ['id', 'name', 'model', 'serial_number', 'note']

class NetworkInterfaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('networks', 'NetworkInterface')
        fields = '__all__'

class VLANSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('networks', 'VLAN')
        fields = '__all__'

class IPAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('networks', 'IPAddress')
        fields = '__all__'

class RoutingTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('networks', 'RoutingTable')
        fields = '__all__'

class ACLSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('networks', 'ACL')
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeSerializer(read_only=True)
    division = DivisionShortSerializer(read_only=True)
    subdivision = SubdivisionShortSerializer(read_only=True)
    facility = FacilityShortSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    disposal_info = serializers.SerializerMethodField()
    category = EquipmentCategorySerializer(read_only=True)
    product_structures = ProductStructureSerializer(many=True, read_only=True)
    first_invoice = serializers.CharField(required=False, allow_null=True)
    material_invoice = serializers.CharField(required=False, allow_null=True)
    ver_software = serializers.CharField(required=False, allow_null=True)
    
    # Сетевые настройки
    network_interfaces = NetworkInterfaceSerializer(many=True, read_only=True)
    vlans = VLANSerializer(many=True, read_only=True)
    ip_addresses = IPAddressSerializer(many=True, read_only=True)
    routing_table = RoutingTableSerializer(many=True, read_only=True)
    acls = ACLSerializer(many=True, read_only=True)
    
    network_interfaces_count = serializers.IntegerField(read_only=True)
    ip_addresses_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'type', 'is_closed', 'is_network', 'category', 'category_display',
            'status', 'status_display', 'serial_number', 'inventory_number',
            'first_invoice', 'material_invoice', 'ver_software', 'product_structures',
            'manufacturing_date', 'exploitation_date', 'division', 'subdivision', 
            'facility', 'assigned_to', 'comments', 'created_at', 'updated_at', 'disposal_info',
            'network_interfaces', 'vlans', 'ip_addresses', 'routing_table', 'acls',
            'network_interfaces_count', 'ip_addresses_count'
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

    def update(self, instance, validated_data):
        product_structures_data = self.context['request'].data.get('product_structures', [])
        
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
            
        category_value = self.context['request'].data.get('category')
        if category_value:
            try:
                instance.category = EquipmentCategory.objects.get(value=category_value)
            except EquipmentCategory.DoesNotExist:
                instance.category = None
        elif category_value is None:
            instance.category = None
            
        # Обработка сетевых интерфейсов
        network_interfaces_data = self.context['request'].data.get('network_interfaces', [])
        if network_interfaces_data and instance.is_network:
            NetworkInterface = apps.get_model('networks', 'NetworkInterface')
            current_interfaces = {str(i.id): i for i in instance.net_interfaces.all()}
            new_interface_ids = []
            
            for interface_data in network_interfaces_data:
                interface_id = str(interface_data.get('id')) if interface_data.get('id') else None
                
                if interface_id and interface_id in current_interfaces:
                    interface = current_interfaces[interface_id]
                    for attr, value in interface_data.items():
                        if attr != 'id':
                            setattr(interface, attr, value)
                    interface.save()
                    new_interface_ids.append(interface_id)
                else:
                    interface = NetworkInterface.objects.create(
                        equipment=instance,
                        **{k: v for k, v in interface_data.items() if k != 'id'}
                    )
                    new_interface_ids.append(str(interface.id))
            
            for interface_id, interface in current_interfaces.items():
                if interface_id not in new_interface_ids:
                    interface.delete()
            
        if product_structures_data:
            current_structures = {str(s.id): s for s in instance.product_structures.all()}
            new_structure_ids = []
            
            for structure_data in product_structures_data:
                structure_id = str(structure_data.get('id')) if structure_data.get('id') else None
                
                if structure_id and structure_id in current_structures:
                    structure = current_structures[structure_id]
                    for attr, value in structure_data.items():
                        if attr != 'id':
                            setattr(structure, attr, value)
                    structure.save()
                    new_structure_ids.append(structure_id)
                else:
                    structure = ProductStructure.objects.create(
                        equipment=instance,
                        name=structure_data.get('name', ''),
                        model=structure_data.get('model'),
                        serial_number=structure_data.get('serial_number'),
                        note=structure_data.get('note')
                    )
                    new_structure_ids.append(str(structure.id))
            
            for structure_id, structure in current_structures.items():
                if structure_id not in new_structure_ids:
                    structure.delete()
            
        for attr, value in validated_data.items():
            if attr not in ['division', 'subdivision', 'facility', 'assigned_to', 'category', 'product_structures', 'network_interfaces']:
                setattr(instance, attr, value)
                
        instance.save()
        return instance

class EquipmentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_category = serializers.DictField(child=serializers.IntegerField())
    by_status = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
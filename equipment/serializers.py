from rest_framework import serializers
from facilities.models import Division, Subdivision, Facility
from users.models import Employee
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
        extra_kwargs = {
            'value': {'validators': []},
        }

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
    # Существующие поля для чтения
    assigned_to = EmployeeSerializer(read_only=True)
    division = DivisionShortSerializer(read_only=True)  # для чтения
    subdivision = SubdivisionShortSerializer(read_only=True)
    facility = FacilityShortSerializer(read_only=True)
    
    # Добавьте эти поля для записи
    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        write_only=True,
        source='division',
        required=True
    )
    subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(),
        write_only=True,
        source='subdivision',
        required=False,
        allow_null=True
    )
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(),
        write_only=True,
        source='facility',
        required=False,
        allow_null=True
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        write_only=True,
        source='assigned_to',
        required=False,
        allow_null=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    disposal_info = serializers.SerializerMethodField()
    category = EquipmentCategorySerializer(required=False, allow_null=True)
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
            # все существующие поля
            'id', 'name', 'type', 'is_closed', 'is_network', 'category', 'category_display',
            'status', 'status_display', 'serial_number', 'inventory_number',
            'first_invoice', 'material_invoice', 'ver_software', 'product_structures',
            'manufacturing_date', 'exploitation_date', 'division', 'subdivision', 
            'facility', 'assigned_to', 'comments', 'created_at', 'updated_at', 'disposal_info',
            'network_interfaces', 'vlans', 'ip_addresses', 'routing_table', 'acls',
            'network_interfaces_count', 'ip_addresses_count',
            # добавьте новые поля для записи
            'division_id', 'subdivision_id', 'facility_id', 'assigned_to_id'
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
    
    def to_internal_value(self, data):
        # Обрабатываем поля связанных объектов
        for field_name in ['division', 'subdivision', 'facility', 'assigned_to']:
            if field_name in data and data[field_name] is not None:
                if isinstance(data[field_name], dict) and 'id' in data[field_name]:
                    # Преобразуем объект в ID
                    data[f'{field_name}_id'] = data[field_name]['id']
                    del data[field_name]
                elif isinstance(data[field_name], (int, str)):
                    # Если пришел ID, преобразуем в правильное поле
                    data[f'{field_name}_id'] = data[field_name]
                    del data[field_name]
        
        # Обрабатываем category
        if 'category' in data and data['category'] is not None:
            if isinstance(data['category'], (int, str)):
                data['category'] = {'value': data['category']}
            elif isinstance(data['category'], dict):
                if 'value' in data['category']:
                    pass
                elif 'id' in data['category']:
                    data['category'] = {'value': data['category']['id']}
                else:
                    raise serializers.ValidationError({
                        'category': "Invalid format. Expected object with 'value' or 'id'."
                    })
            else:
                raise serializers.ValidationError({
                    'category': "Invalid format. Expected ID or object with value."
                })
        
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        print("Validated data in create:", validated_data)
        
        # Извлекаем данные для связанных полей
        division = validated_data.pop('division', None)
        subdivision = validated_data.pop('subdivision', None)
        facility = validated_data.pop('facility', None)
        assigned_to = validated_data.pop('assigned_to', None)
        category_data = validated_data.pop('category', None)
        product_structures_data = validated_data.pop('product_structures', [])

        if not division:
            raise serializers.ValidationError({
                "division": "Это поле обязательно для заполнения."
            })

        # Создаем объект Equipment
        equipment = Equipment.objects.create(
            division=division,
            subdivision=subdivision,
            facility=facility,
            assigned_to=assigned_to,
            **validated_data
        )

        # Обрабатываем категорию
        if category_data:
            category_value = category_data.get('value')
            try:
                equipment.category = EquipmentCategory.objects.get(value=category_value)
            except EquipmentCategory.DoesNotExist:
                # Если категория не найдена, создаем новую
                equipment.category = EquipmentCategory.objects.create(**category_data)
        else:
            equipment.category = None
            
        equipment.save()

        # Создаем структуры продукта
        for structure_data in product_structures_data:
            ProductStructure.objects.create(
                equipment=equipment,
                **structure_data
            )
        
        return equipment

    def update(self, instance, validated_data):
        print("Validated data in update:", validated_data)
        product_structures_data = self.context['request'].data.get('product_structures', [])
        
        # Получаем ID из validated_data вместо request.data
        division_id = validated_data.pop('division_id', None)
        if division_id is not None:
            instance.division_id = division_id
        
        subdivision_id = validated_data.pop('subdivision_id', None)
        if subdivision_id is not None:
            instance.subdivision_id = subdivision_id
            
        facility_id = validated_data.pop('facility_id', None)
        if facility_id is not None:
            instance.facility_id = facility_id
            
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            instance.assigned_to_id = assigned_to_id
            
        # Обработка категории
        category_data = validated_data.pop('category', None)
        if category_data is not None:
            category_value = category_data.get('value')
            try:
                instance.category = EquipmentCategory.objects.get(value=category_value)
            except EquipmentCategory.DoesNotExist:
                # Если категория не найдена, создаем новую
                instance.category = EquipmentCategory.objects.create(**category_data)
        elif category_data is None:
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
            if attr not in ['division_id', 'subdivision_id', 'facility_id', 'assigned_to_id', 'category', 'product_structures', 'network_interfaces']:
                setattr(instance, attr, value)
                
        instance.save()
        return instance

class EquipmentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_category = serializers.DictField(child=serializers.IntegerField())
    by_status = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
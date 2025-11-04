from rest_framework import serializers
from .models import CommunicationPost, Division, FacilityType, Subdivision, Facility

# Добавьте эти сериализаторы в начало файла
class DivisionForFacilitySerializer(serializers.ModelSerializer):
    """Сериализатор подразделения для объектов"""
    class Meta:
        model = Division
        fields = ['id', 'name', 'order']

class SubdivisionForFacilitySerializer(serializers.ModelSerializer):
    """Сериализатор отделения для объектов"""
    class Meta:
        model = Subdivision
        fields = ['id', 'name', 'order']

class FacilityShortSerializer(serializers.ModelSerializer):
    """Укороченный сериализатор для объектов Facility"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class_display = serializers.CharField(source='get_facility_class_display', read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    # Добавляем название типа объекта
    type_name = serializers.CharField(source='type.name', read_only=True)  # Добавляем эту строку

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_display', 'type_name', 'facility_class', 'class_display', 
            'subdivision', 'is_closed', 'communication_posts', 'inn'
        ]

class SubdivisionSerializer(serializers.ModelSerializer):
    employees_count = serializers.SerializerMethodField()
    management_count = serializers.SerializerMethodField()
    officers_count = serializers.SerializerMethodField()
    warrant_officers_count = serializers.SerializerMethodField()
    civilian_count = serializers.SerializerMethodField()
    equipment_count = serializers.SerializerMethodField()
    facilities_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    facilities = FacilityShortSerializer(many=True, read_only=True)
    order = serializers.IntegerField(required=False, default=0)
    
    class Meta:
        model = Subdivision
        fields = [
            'id', 'name', 'division', 'order',
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian', 'created_at', 'updated_at',
            'employees_count', 'management_count', 'officers_count',
            'warrant_officers_count', 'civilian_count', 'equipment_count',
            'facilities_count', 'tasks_count', 'facilities'
        ]

    def get_employees_count(self, obj):
        return obj.get_employees_count()
    
    def get_management_count(self, obj):
        return obj.get_management_count()
    
    def get_officers_count(self, obj):
        return obj.get_officers_count()
    
    def get_warrant_officers_count(self, obj):
        return obj.get_warrant_officers_count()
    
    def get_civilian_count(self, obj):
        return obj.get_civilian_count()
    
    def get_equipment_count(self, obj):
        return obj.get_equipment_count()

    def get_facilities_count(self, obj):
        return obj.get_facilities_count()
    
    def get_tasks_count(self, obj):
        return obj.get_tasks_count() 

class DivisionSerializer(serializers.ModelSerializer):
    employees_count = serializers.SerializerMethodField()
    management_count = serializers.SerializerMethodField()
    officers_count = serializers.SerializerMethodField()
    warrant_officers_count = serializers.SerializerMethodField()
    civilian_count = serializers.SerializerMethodField()
    equipment_count = serializers.SerializerMethodField()
    facilities_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    networks_count = serializers.IntegerField(read_only=True)
    subdivisions = SubdivisionSerializer(many=True, read_only=True)
    facilities = FacilityShortSerializer(many=True, read_only=True)
    order = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = Division
        fields = [
            'id', 'name', 'order',
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian',
            'employees_count', 'management_count', 'officers_count', 
            'warrant_officers_count', 'civilian_count', 'equipment_count', 
            'tasks_count', 'facilities_count', 'networks_count', 'subdivisions', 'facilities',
            'created_at', 'updated_at'
        ]

    def get_employees_count(self, obj):
        return obj.get_employees_count()
    
    def get_management_count(self, obj):
        return obj.get_management_count()
    
    def get_officers_count(self, obj):
        return obj.get_officers_count()
    
    def get_warrant_officers_count(self, obj):
        return obj.get_warrant_officers_count()
    
    def get_civilian_count(self, obj):
        return obj.get_civilian_count()
    
    def get_equipment_count(self, obj):
        return obj.get_equipment_count()

    def get_facilities_count(self, obj):
        return obj.get_facilities_count()
    
    def get_tasks_count(self, obj):
        return obj.get_tasks_count()
    
    def get_networks_count(self, obj):
        return obj.get_networks_count()


class FacilityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityType
        fields = ['id', 'name', 'description']

class CommunicationPostSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source='division.name', read_only=True)
    
    class Meta:
        model = CommunicationPost
        fields = ['id', 'name', 'division', 'division_name', 'subdivision', 'description']       

class FacilitySerializer(serializers.ModelSerializer):
    equipment_count = serializers.SerializerMethodField()
    division_name = serializers.CharField(source='division.name', read_only=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True, allow_null=True)
    
    # Добавляем сериализаторы для подразделений с полем order
    division = DivisionForFacilitySerializer(read_only=True)
    subdivision = SubdivisionForFacilitySerializer(read_only=True, allow_null=True)
    
    type = FacilityTypeSerializer(read_only=True)
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=FacilityType.objects.all(),
        source='type',
        write_only=True,
        required=False
    )
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class_display = serializers.CharField(source='get_facility_class_display', read_only=True)
    is_closed = serializers.BooleanField()
    communication_posts = CommunicationPostSerializer(many=True, read_only=True)
    communication_post_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=CommunicationPost.objects.all(),
        source='communication_posts',
        write_only=True,
        required=False
    )
    inn = serializers.CharField(allow_null=True, required=False, max_length=12)
    city = serializers.CharField(required=False, allow_null=True)
    street = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    house_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    # Добавляем поля для записи
    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        source='division',
        write_only=True,
        required=True
    )
    subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(),
        source='subdivision',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_id', 'type_display', 'facility_class', 'class_display',
            'address', 'division', 'division_name', 'subdivision', 'subdivision_name', 
            'division_id', 'subdivision_id',  # Добавляем поля для записи
            'city', 'street', 'house_number', 'address',
            'equipment_count', 'comments', 'acceptance_act_number', 'rim_act_number',
            'commissioning_act_number', 'opening_permission_number', 'is_closed', 'communication_posts', 
            'communication_post_ids', 'kz_size', 'has_transformer_in_kz', 'has_grounding_in_kz', 
            'communication_posts', 'inn', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'address': {'read_only': True}
        }

    def get_equipment_count(self, obj):
        return obj.equipment.count()
    
    def create(self, validated_data):
        posts_data = validated_data.pop('communication_posts', [])
        validated_data.pop('divisionData', None)
        validated_data.pop('addressParts', None)
        instance = super().create(validated_data)
        instance.communication_posts.set(posts_data)
        return instance

    def update(self, instance, validated_data):
        validated_data.pop('divisionData', None)
        validated_data.pop('addressParts', None)
        posts_data = validated_data.pop('communication_posts', None)
        instance = super().update(instance, validated_data)
        if posts_data is not None:
            instance.communication_posts.set(posts_data)
        return instance

class FacilityStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_type = serializers.DictField(child=serializers.IntegerField())
    by_class = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
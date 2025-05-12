from rest_framework import serializers
from .models import CommunicationPost, Division, Subdivision, Facility

class FacilityShortSerializer(serializers.ModelSerializer):
    """Укороченный сериализатор для объектов Facility"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class_display = serializers.CharField(source='get_facility_class_display', read_only=True)
    is_closed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_display', 'facility_class', 'class_display', 
            'subdivision', 'is_closed', 'communication_posts', 'inn'
        ]

class SubdivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdivision
        fields = [
            'id', 'name', 'division', 
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian', 'created_at', 'updated_at'
        ]

class DivisionSerializer(serializers.ModelSerializer):
    employees_count = serializers.SerializerMethodField()
    management_count = serializers.SerializerMethodField()
    officers_count = serializers.SerializerMethodField()
    warrant_officers_count = serializers.SerializerMethodField()
    civilian_count = serializers.SerializerMethodField()
    equipment_count = serializers.SerializerMethodField()
    facilities_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    subdivisions = SubdivisionSerializer(many=True, read_only=True)
    facilities = FacilityShortSerializer(many=True, read_only=True)
    # staff_completion = serializers.SerializerMethodField()

    class Meta:
        model = Division
        fields = [
            'id', 'name', 
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian',
            'employees_count', 'management_count', 'officers_count', 
            'warrant_officers_count', 'civilian_count', 'equipment_count', 
            'tasks_count', 'facilities_count', 'subdivisions', 'facilities',
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
    
    # def get_staff_completion(self, obj):
    # # Расчет укомплектованности по общему штату
    #     total_actual = obj.get_employees_count()
    #     return round((total_actual / obj.staff_planned_total) * 100, 2) if obj.staff_planned_total > 0 else 0

class CommunicationPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationPost
        fields = ['id', 'name', 'value', 'division', 'subdivision']

class FacilitySerializer(serializers.ModelSerializer):
    equipment_count = serializers.SerializerMethodField()
    division_name = serializers.CharField(source='division.name', read_only=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True, allow_null=True)
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

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_display', 'facility_class', 'class_display',
            'address', 'division', 'division_name', 'subdivision', 'subdivision_name', 
            'equipment_count', 'comments', 'acceptance_act_number', 'rim_act_number',
            'commissioning_act_number', 'opening_permission_number', 'is_closed', 'communication_posts', 
            'communication_post_ids', 'kz_size', 'has_transformer_in_kz', 'has_grounding_in_kz', 
            'communication_posts', 'inn', 'created_at', 'updated_at'
        ]

    def get_equipment_count(self, obj):
        return obj.equipment.count()
    
    # def validate(self, data):
    #     is_closed = data.get('is_closed', self.instance.is_closed if self.instance else False)
        
    #     if not is_closed:
    #         if 'communication_posts' not in data or data['communication_posts'] is None:
    #             raise serializers.ValidationError({'communication_posts': 'Для открытого объекта необходимо указать количество постов связи'})
    #         data['facility_class'] = None
    #         data['inn'] = None
    #     else:
    #         if 'facility_class' not in data or data['facility_class'] is None:
    #             raise serializers.ValidationError({'facility_class': 'Для закрытого объекта необходимо указать класс'})
    #         if 'inn' not in data or data['inn'] is None:
    #             raise serializers.ValidationError({'inn': 'Для закрытого объекта необходимо указать ИНН'})
    #         data['communication_posts'] = None
        
    #     return data
    
    def create(self, validated_data):
        posts_data = validated_data.pop('communication_posts', [])
        instance = super().create(validated_data)
        instance.communication_posts.set(posts_data)
        return instance

    def update(self, instance, validated_data):
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
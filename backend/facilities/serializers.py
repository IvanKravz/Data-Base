from rest_framework import serializers
from .models import CommunicationPost, Division, FacilityType, Subdivision, Facility
from employees.models import Employee


# --- Краткий сериализатор для сотрудников (руководителей) ---
class EmployeeBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position', 'rank', 'personal_phone', 'work_phone']


# --- Краткий сериализатор для объектов ---
class FacilityShortSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class_display = serializers.CharField(source='get_facility_class_display', read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    type_name = serializers.CharField(source='type.name', read_only=True)

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_display', 'type_name', 'facility_class', 'class_display',
            'subdivision', 'is_closed', 'communication_posts', 'inn'
        ]


# --- Посты связи ---
class CommunicationPostBriefSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)

    class Meta:
        model = CommunicationPost
        fields = ['id', 'name', 'kind', 'kind_display']


class CommunicationPostSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source='division.name', read_only=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True)
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    parent = CommunicationPostBriefSerializer(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=CommunicationPost.objects.all(),
        source='parent',
        write_only=True,
        required=False,
        allow_null=True,
    )
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    children = CommunicationPostBriefSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()
    full_path = serializers.CharField(read_only=True)

    class Meta:
        model = CommunicationPost
        fields = [
            'id', 'name', 'kind', 'kind_display',
            'parent', 'parent_id', 'parent_name',
            'children', 'children_count', 'full_path',
            'division', 'division_name',
            'subdivision', 'subdivision_name',
            'description', 'created_at', 'updated_at',
        ]

    def get_children_count(self, obj):
        return obj.children.count()

    def validate(self, attrs):
        instance = self.instance
        kind = attrs.get('kind', instance.kind if instance else CommunicationPost.POST_KIND_P)
        parent = attrs.get('parent', instance.parent if instance else None)
        division = attrs.get('division', instance.division if instance else None)

        if parent is not None:
            # Тип родителя допустим для нашего типа
            allowed = CommunicationPost.ALLOWED_PARENTS.get(kind, ())
            if parent.kind not in allowed:
                raise serializers.ValidationError({
                    'parent_id': (
                        f'Для поста типа «{dict(CommunicationPost.POST_KIND_CHOICES).get(kind)}» '
                        f'недопустим родитель типа «{parent.get_kind_display()}».'
                    )
                })

            # Родитель — из того же подразделения
            if division is not None and parent.division_id != division.id:
                raise serializers.ValidationError({
                    'parent_id': 'Родительский пост должен принадлежать тому же подразделению.'
                })

            # Запрет циклов
            if instance is not None:
                ancestor = parent
                while ancestor is not None:
                    if ancestor.pk == instance.pk:
                        raise serializers.ValidationError({'parent_id': 'Обнаружена циклическая ссылка.'})
                    ancestor = ancestor.parent
        else:
            if kind not in (CommunicationPost.POST_KIND_P, CommunicationPost.POST_KIND_KP):
                raise serializers.ValidationError({
                    'parent_id': (
                        f'Пост типа «{dict(CommunicationPost.POST_KIND_CHOICES).get(kind)}» '
                        f'должен иметь родителя.'
                    )
                })
        return attrs


class CommunicationPostTreeSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationPost
        fields = [
            'id', 'name', 'kind', 'kind_display',
            'division', 'subdivision', 'description',
            'children',
        ]

    def get_children(self, obj):
        children = obj.children.all()
        return CommunicationPostTreeSerializer(children, many=True, context=self.context).data


# --- Сериализатор отделения ---
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

    head = serializers.SerializerMethodField()
    deputy_head = serializers.SerializerMethodField()
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='head', required=False, allow_null=True, write_only=True
    )
    deputy_head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='deputy_head', required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Subdivision
        fields = [
            'id', 'name', 'division', 'order',
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian', 'created_at', 'updated_at',
            'employees_count', 'management_count', 'officers_count',
            'warrant_officers_count', 'civilian_count', 'equipment_count',
            'facilities_count', 'tasks_count', 'facilities',
            'head', 'deputy_head', 'head_id', 'deputy_head_id',
        ]

    def get_employees_count(self, obj): return obj.get_employees_count()
    def get_management_count(self, obj): return obj.get_management_count()
    def get_officers_count(self, obj): return obj.get_officers_count()
    def get_warrant_officers_count(self, obj): return obj.get_warrant_officers_count()
    def get_civilian_count(self, obj): return obj.get_civilian_count()
    def get_equipment_count(self, obj): return obj.get_equipment_count()
    def get_facilities_count(self, obj): return obj.get_facilities_count()
    def get_tasks_count(self, obj): return obj.get_tasks_count()

    def _get_leader(self, obj, position_title, explicit_field):
        if not explicit_field:
            return None
        return EmployeeBriefSerializer(explicit_field).data

    def get_head(self, obj):
        return EmployeeBriefSerializer(obj.head).data if obj.head else None

    def get_deputy_head(self, obj):
        return EmployeeBriefSerializer(obj.deputy_head).data if obj.deputy_head else None


# --- Сериализатор подразделения ---
class DivisionSerializer(serializers.ModelSerializer):
    employees_count = serializers.SerializerMethodField()
    management_count = serializers.SerializerMethodField()
    officers_count = serializers.SerializerMethodField()
    warrant_officers_count = serializers.SerializerMethodField()
    civilian_count = serializers.SerializerMethodField()
    equipment_count = serializers.SerializerMethodField()
    facilities_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    networks_count = serializers.SerializerMethodField()
    subdivisions = SubdivisionSerializer(many=True, read_only=True)
    facilities = FacilityShortSerializer(many=True, read_only=True)
    order = serializers.IntegerField(required=False, default=0)

    head = serializers.SerializerMethodField()
    deputy_head = serializers.SerializerMethodField()
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='head', required=False, allow_null=True, write_only=True
    )
    deputy_head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='deputy_head', required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Division
        fields = [
            'id', 'name', 'order',
            'staff_planned_total', 'staff_planned_management',
            'staff_planned_officers', 'staff_planned_warrant_officers',
            'staff_planned_civilian',
            'employees_count', 'management_count', 'officers_count',
            'warrant_officers_count', 'civilian_count', 'equipment_count',
            'tasks_count', 'facilities_count', 'networks_count',
            'subdivisions', 'facilities',
            'head', 'deputy_head', 'head_id', 'deputy_head_id',
            'created_at', 'updated_at'
        ]

    def get_employees_count(self, obj): return obj.get_employees_count()
    def get_management_count(self, obj): return obj.get_management_count()
    def get_officers_count(self, obj): return obj.get_officers_count()
    def get_warrant_officers_count(self, obj): return obj.get_warrant_officers_count()
    def get_civilian_count(self, obj): return obj.get_civilian_count()
    def get_equipment_count(self, obj): return obj.get_equipment_count()
    def get_facilities_count(self, obj): return obj.get_facilities_count()
    def get_tasks_count(self, obj): return obj.get_tasks_count()
    def get_networks_count(self, obj): return obj.get_networks_count()

    def _get_leader(self, obj, position_title, explicit_field):
        if not explicit_field:
            return None
        return EmployeeBriefSerializer(explicit_field).data

    def get_head(self, obj):
        return EmployeeBriefSerializer(obj.head).data if obj.head else None

    def get_deputy_head(self, obj):
        return EmployeeBriefSerializer(obj.deputy_head).data if obj.deputy_head else None


# --- Вспомогательные сериализаторы ---
class DivisionForFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'order']


class SubdivisionForFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdivision
        fields = ['id', 'name', 'order']


class FacilityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityType
        fields = ['id', 'name', 'description', 'is_closed_type']


class FacilitySerializer(serializers.ModelSerializer):
    equipment_count = serializers.SerializerMethodField()
    division_name = serializers.CharField(source='division.name', read_only=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True, allow_null=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, read_only=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, read_only=True)

    division = DivisionForFacilitySerializer(read_only=True)
    subdivision = SubdivisionForFacilitySerializer(read_only=True, allow_null=True)

    type = FacilityTypeSerializer(read_only=True)
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=FacilityType.objects.all(),
        source='type', write_only=True, required=False
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

    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(), source='division', write_only=True, required=True
    )
    subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(), source='subdivision',
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'type', 'type_id', 'type_display', 'facility_class', 'class_display',
            'address', 'division', 'division_name', 'subdivision', 'subdivision_name',
            'division_id', 'subdivision_id',
            'city', 'street', 'house_number', 'address',
            'equipment_count', 'comments', 'acceptance_act_number', 'rim_act_number',
            'commissioning_act_number', 'opening_permission_number', 'is_closed', 'communication_posts',
            'communication_post_ids', 'kz_size', 'has_transformer_in_kz', 'has_grounding_in_kz',
            'inn', 'latitude', 'longitude', 'created_at', 'updated_at'
        ]
        extra_kwargs = {'address': {'read_only': True}}

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

    def validate_division_id(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            if (user.is_superuser or
                (hasattr(user, 'has_role') and user.has_role('admin')) or
                (hasattr(user, 'has_role') and user.has_role('leader')) or
                (hasattr(user, 'has_role') and user.has_role('deputy_director'))):
                return value
            user_division = getattr(user, 'division', None)
            if user_division and value != user_division:
                raise serializers.ValidationError('Вы можете создавать объекты только в своем подразделении')
        return value


class FacilityStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_type = serializers.DictField(child=serializers.IntegerField())
    by_class = serializers.DictField(child=serializers.IntegerField())
    by_division = serializers.DictField(child=serializers.IntegerField())
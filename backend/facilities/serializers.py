from rest_framework import serializers
from .models import CommunicationPost, Division, FacilityType, Subdivision, Facility
from employees.models import Employee  # для краткого сериализатора


# --- Краткий сериализатор для сотрудников (руководителей) ---
class EmployeeBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position', 'rank', 'personal_phone', 'work_phone']


# --- Краткий сериализатор для объектов (используется в подразделениях и отделениях) ---
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


# --- Сериализатор отделения (переопределяем head/deputy_head) ---
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

    # Поля руководителей – вычисляемые
    head = serializers.SerializerMethodField()
    deputy_head = serializers.SerializerMethodField()
    # Поля для записи (явное назначение)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='head',
        required=False,
        allow_null=True,
        write_only=True
    )
    deputy_head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='deputy_head',
        required=False,
        allow_null=True,
        write_only=True
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

    # ---- Методы для вычисления руководителей ----
    def _get_leader(self, obj, position_title, explicit_field):
        """
        Возвращает сериализованные данные руководителя.
        Приоритет: явно назначенный (explicit_field) > первый сотрудник с соответствующей должностью.
        """
        if explicit_field:
            return EmployeeBriefSerializer(explicit_field).data

        # Ищем среди ВСЕХ сотрудников с нужной должностью (не только привязанных к этому отделению)
        employee = Employee.objects.filter(position=position_title).order_by('priority', 'full_name').first()
        return EmployeeBriefSerializer(employee).data if employee else None

    def get_head(self, obj):
        return self._get_leader(obj, 'Главный руководитель', obj.head)

    def get_deputy_head(self, obj):
        return self._get_leader(obj, 'Заместитель главного руководителя', obj.deputy_head)


# --- Сериализатор подразделения (переопределяем head/deputy_head) ---
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

    # Поля руководителей – вычисляемые
    head = serializers.SerializerMethodField()
    deputy_head = serializers.SerializerMethodField()
    # Поля для записи (явное назначение)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='head',
        required=False,
        allow_null=True,
        write_only=True
    )
    deputy_head_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='deputy_head',
        required=False,
        allow_null=True,
        write_only=True
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

    # ---- Методы для вычисления руководителей ----
    def _get_leader(self, obj, position_title, explicit_field):
        """
        Возвращает сериализованные данные руководителя.
        Приоритет: явно назначенный (explicit_field) > первый сотрудник с соответствующей должностью.
        """
        if explicit_field:
            return EmployeeBriefSerializer(explicit_field).data

        # Ищем среди ВСЕХ сотрудников с нужной должностью (не только привязанных к этому подразделению)
        employee = Employee.objects.filter(position=position_title).order_by('priority', 'full_name').first()
        return EmployeeBriefSerializer(employee).data if employee else None

    def get_head(self, obj):
        return self._get_leader(obj, 'Главный руководитель', obj.head)

    def get_deputy_head(self, obj):
        return self._get_leader(obj, 'Заместитель главного руководителя', obj.deputy_head)


# --- Остальные сериализаторы (без изменений) ---
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


class CommunicationPostSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source='division.name', read_only=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True)

    class Meta:
        model = CommunicationPost
        fields = ['id', 'name', 'division', 'division_name', 'subdivision', 'subdivision_name', 'description']


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
            'division_id', 'subdivision_id',
            'city', 'street', 'house_number', 'address',
            'equipment_count', 'comments', 'acceptance_act_number', 'rim_act_number',
            'commissioning_act_number', 'opening_permission_number', 'is_closed', 'communication_posts',
            'communication_post_ids', 'kz_size', 'has_transformer_in_kz', 'has_grounding_in_kz',
            'communication_posts', 'inn', 'latitude', 'longitude', 'created_at', 'updated_at'
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
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenObtainPairSerializer

from facilities.models import Division, Subdivision
from .models import User, Employee, ShaWorkerDetails, ShaEquipmentConclusion
import logging

logger = logging.getLogger(__name__)


class TokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        serializer = UserSerializer(user)
        data['user'] = serializer.data
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['is_staff', 'is_active', 'date_joined']

class ShaEquipmentConclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShaEquipmentConclusion
        fields = ['id', 'equipment_type', 'conclusion_number']
        read_only_fields = ['id']   

class ShaWorkerDetailsSerializer(serializers.ModelSerializer):
    equipment_conclusions = ShaEquipmentConclusionSerializer(many=True, required=False)  # Добавляем поле equipment_conclusions
    start_date = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])  # Указываем формат DD-MM-YYYY
    
    class Meta:
        model = ShaWorkerDetails
        fields = ['id', 'start_date', 'access_level', 'equipment_conclusions']
        read_only_fields = ['id']

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name']        

class SubdivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdivision
        fields = ['id', 'name']    

class EmployeeSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    sha_details = ShaWorkerDetailsSerializer(required=False, allow_null=True)
    birth_date = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    contract_date = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    data_state_secrets = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    year_graduation = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    date_start_work = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    date_end_work = serializers.DateField(
        format="%d-%m-%Y", 
        input_formats=["%d-%m-%Y", "iso-8601"],
        allow_null=True,
        required=False
    )
    
    # Для записи используем PrimaryKeyRelatedField
    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        source='division',
        required=False,
        allow_null=True,
        write_only=True
    )
    subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(),
        source='subdivision',
        required=False,
        allow_null=True,
        write_only=True
    )

    create_user = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Создать учетную запись для сотрудника"
    )

    class Meta:
        model = Employee
        fields = '__all__'
        extra_kwargs = {
            'photo': {'write_only': True},# Чтобы само изображение не возвращалось в ответе
            'order_rank': {'required': False, 'allow_blank': True},
            'division': {'required': False},
            'subdivision': {'required': False},
        }

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
            
        try:
            if obj.photo and hasattr(obj.photo, 'url'):
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(obj.photo.url)
                return obj.photo.url
        except Exception:
            return None
        return None
    
    def validate_photo(self, value):
        if value:
            # Проверка размера файла (например, не более 2MB)
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError("Фото слишком большое. Максимальный размер - 2MB.")
            # Проверка типа файла
            if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                raise serializers.ValidationError("Неподдерживаемый формат изображения. Используйте JPG или PNG.")
        return value

    def to_internal_value(self, data):
        # Handle division
        if 'division' in data:
            if isinstance(data['division'], dict) and 'id' in data['division']:
                data['division_id'] = data['division']['id']
            elif data['division'] is None:
                data['division_id'] = None
            data.pop('division', None)

        # Handle subdivision
        if 'subdivision' in data:
            if isinstance(data['subdivision'], dict) and 'id' in data['subdivision']:
                data['subdivision_id'] = data['subdivision']['id']
            elif data['subdivision'] is None:
                data['subdivision_id'] = None
            data.pop('subdivision', None)

        return super().to_internal_value(data)

    def create(self, validated_data):
        division = validated_data.pop('division', None)
        subdivision = validated_data.pop('subdivision', None)
        sha_details_data = validated_data.pop('sha_details', None)
        is_sha_worker = validated_data.get('is_sha_worker', False)
        create_user = validated_data.pop('create_user', False)

        employee = Employee.objects.create(
            division=division,
            subdivision=subdivision,
            **validated_data
        )

        # Создаем пользователя если требуется
        if create_user:
            User = get_user_model()
            username = f"{employee.full_name.split()[0].lower()}{employee.id}"
            user = User.objects.create_user(
                username=username,
                password='defaultpassword',
                employee=employee
            )

        # Обрабатываем данные ШаРаботника
        if is_sha_worker and sha_details_data:
            equipment_conclusions_data = sha_details_data.pop('equipment_conclusions', [])
            sha_details = ShaWorkerDetails.objects.create(employee=employee, **sha_details_data)
            
            # Создаем оборудование через метод set()
            equipment_conclusions = [
                ShaEquipmentConclusion(sha_worker=sha_details, **ec_data)
                for ec_data in equipment_conclusions_data
            ]
            ShaEquipmentConclusion.objects.bulk_create(equipment_conclusions)
    
        return employee

    def update(self, instance, validated_data):
        division_id = validated_data.pop('division_id', None)
        subdivision_id = validated_data.pop('subdivision_id', None)
        
        # Явно проверяем наличие is_sha_worker в validated_data
        is_sha_worker = validated_data.get('is_sha_worker', instance.is_sha_worker)
        
        # Только если сотрудник остается ШаРаботником, обрабатываем sha_details
        sha_details_data = validated_data.pop('sha_details', None) if is_sha_worker else None
        
        if division_id is not None:
            instance.division = Division.objects.get(id=division_id) if division_id else None

        if subdivision_id is not None:
            instance.subdivision = Subdivision.objects.get(id=subdivision_id) if subdivision_id else None
        
        instance = super().update(instance, validated_data)

        if is_sha_worker:
            if sha_details_data:
                equipment_conclusions_data = sha_details_data.pop('equipment_conclusions', [])
                sha_details, created = ShaWorkerDetails.objects.update_or_create(
                    employee=instance,
                    defaults=sha_details_data
                )
                
                # Удаляем старые и создаем новые записи оборудования
                sha_details.equipment_conclusions.all().delete()
                equipment_conclusions = [
                    ShaEquipmentConclusion(sha_worker=sha_details, **ec_data)
                    for ec_data in equipment_conclusions_data
                ]
                ShaEquipmentConclusion.objects.bulk_create(equipment_conclusions)
        else:
            # Удаляем данные ШаРаботника если флаг снят
            ShaWorkerDetails.objects.filter(employee=instance).delete()
    
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Убедимся, что division и subdivision представлены с id и name
        if representation.get('division') is None:
            representation['division'] = None
        if representation.get('subdivision') is None:
            representation['subdivision'] = None
        return representation
    
    
class EmployeeDictionariesSerializer(serializers.Serializer):
    categories = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    subcategories = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    officer_positions = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    management_officer_ranks = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    warrant_officer_positions = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    civilian_positions = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    officer_ranks = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    warrant_officer_ranks = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

class EmployeePhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Employee
        fields = ['id', 'photo', 'photo_url']
        read_only_fields = ['id']
    
    def get_photo_url(self, obj):
        """
        Явно возвращаем URL или None
        Обновляем состояние при каждом запросе
        """
        if hasattr(obj, 'photo') and obj.photo:
            try:
                # Принудительно обновляем объект
                obj.refresh_from_db()
                
                if obj.photo:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.photo.url)
                    return obj.photo.url
            except Exception:
                pass
        return None
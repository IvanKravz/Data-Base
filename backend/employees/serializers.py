# employees/serializers.py
import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
# from backend.users.permissions import RoleBasedPermission
from facilities.models import Division, Subdivision
from .models import Employee, ShaWorkerDetails, ShaEquipmentConclusion
import logging

logger = logging.getLogger(__name__)


class ShaEquipmentConclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShaEquipmentConclusion
        fields = ['id', 'equipment_type', 'conclusion_number']
        read_only_fields = ['id']   


class ShaWorkerDetailsSerializer(serializers.ModelSerializer):
    equipment_conclusions = ShaEquipmentConclusionSerializer(many=True, required=False)
    start_date = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    
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
    personal_phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    work_phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    rank = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    date_fields = ['birth_date', 'contract_date', 'data_state_secrets', 
                   'year_graduation', 'date_start_work', 'date_end_work']
    
    for field_name in date_fields:
        vars()[field_name] = serializers.DateField(
            format="%d-%m-%Y", 
            input_formats=["%d-%m-%Y", "iso-8601"],
            allow_null=True,
            required=False
        )
    
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
        read_only_fields = ['id']
        extra_kwargs = {
            'photo': {'write_only': True},
            'order_rank': {'required': False, 'allow_blank': True},
            'division': {'required': False},
            'subdivision': {'required': False},
        }

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        try:
            return obj.photo.url
        except Exception:
            return None
    
    # def validate(self, data):
    #     request = self.context.get('request')
    #     if request and request.user.is_authenticated:
    #         # Убедитесь, что RoleBasedPermission импортирован в начале файла
    #         if RoleBasedPermission.is_view_only_user(request.user):
    #             if self.instance:
    #                 raise serializers.ValidationError({
    #                     'detail': 'Ваши роли позволяют только просматривать данные без возможности изменений'
    #                 })
    #             else:
    #                 raise serializers.ValidationError({
    #                     'detail': 'Ваши роли не позволяют создавать новые записи'
    #                 })
                    
    #     return data

    def to_internal_value(self, data):
        if 'division' in data:
            if isinstance(data['division'], dict) and 'id' in data['division']:
                data['division_id'] = data['division']['id']
            elif data['division'] is None:
                data['division_id'] = None
            data.pop('division', None)

        if 'subdivision' in data:
            if isinstance(data['subdivision'], dict) and 'id' in data['subdivision']:
                data['subdivision_id'] = data['subdivision']['id']
            elif data['subdivision'] is None:
                data['subdivision_id'] = None
            data.pop('subdivision', None)

        return super().to_internal_value(data)

    def create(self, validated_data):
        validated_data.pop('id', None)
        
        division = validated_data.pop('division', None)
        subdivision = validated_data.pop('subdivision', None)
        sha_details_data = validated_data.pop('sha_details', None)
        is_sha_worker = validated_data.get('is_sha_worker', False)
        create_user = validated_data.pop('create_user', False)

        try:
            employee = Employee.objects.create(
                division=division,
                subdivision=subdivision,
                **validated_data
            )

            if create_user:
                User = get_user_model()
                username = f"{employee.full_name.split()[0].lower()}{employee.id}"
                user = User.objects.create_user(
                    username=username,
                    password='defaultpassword',
                    employee=employee
                )

            if is_sha_worker and sha_details_data:
                equipment_conclusions_data = sha_details_data.pop('equipment_conclusions', [])
                sha_details = ShaWorkerDetails.objects.create(employee=employee, **sha_details_data)
                
                equipment_conclusions = [
                    ShaEquipmentConclusion(sha_worker=sha_details, **ec_data)
                    for ec_data in equipment_conclusions_data
                ]
                ShaEquipmentConclusion.objects.bulk_create(equipment_conclusions)
        
            return employee
            
        except Exception as e:
            logger.error(f"Error creating employee: {str(e)}")
            raise

    def update(self, instance, validated_data):
        division_id = validated_data.pop('division_id', None)
        subdivision_id = validated_data.pop('subdivision_id', None)
        
        is_sha_worker = validated_data.get('is_sha_worker', instance.is_sha_worker)
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
                
                sha_details.equipment_conclusions.all().delete()
                equipment_conclusions = [
                    ShaEquipmentConclusion(sha_worker=sha_details, **ec_data)
                    for ec_data in equipment_conclusions_data
                ]
                ShaEquipmentConclusion.objects.bulk_create(equipment_conclusions)
        else:
            ShaWorkerDetails.objects.filter(employee=instance).delete()
    
        return instance


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
    photo_url = serializers.SerializerMethodField()

    def get_photo_url(self, obj):
        if obj.photo:
            return obj.photo.url
        return None

    class Meta:
        model = Employee
        fields = ['id', 'photo_url']
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
    division = DivisionSerializer() 
    subdivision = SubdivisionSerializer() 
    sha_details = ShaWorkerDetailsSerializer(required=False)
    birth_date = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    contract_date = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    data_state_secrets = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    year_graduation = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    date_start_work = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    date_end_work = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y", "iso-8601"])
    
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


    def create(self, validated_data):
        subdivision_data = validated_data.pop('division', None)
        division_data = validated_data.pop('division', None)
        sha_details_data = validated_data.pop('sha_details', None)
        is_sha_worker = validated_data.get('is_sha_worker', False)

        if division_data and 'id' in division_data:
            division = Division.objects.get(id=division_data['id'])
        else:
            division = None

        if subdivision_data and 'id' in subdivision_data:
            subdivision = Subdivision.objects.get(id=subdivision_data['id'])
        else:
            subdivision = None

        employee = Employee.objects.create(division=division, subdivision=subdivision, **validated_data)

        if is_sha_worker and sha_details_data:
            sha_details = ShaWorkerDetails.objects.create(employee=employee, **sha_details_data)
            equipment_conclusions_data = sha_details_data.get('equipment_conclusions', [])
            for ec_data in equipment_conclusions_data:
                ShaEquipmentConclusion.objects.create(sha_worker=sha_details, **ec_data)

        return employee

    def update(self, instance, validated_data):
        logger.info(f"Validated data: {validated_data}")
        division_data = validated_data.pop('division', None)
        subdivision_data = validated_data.pop('subdivision', None)
        sha_details_data = validated_data.pop('sha_details', None)
        logger.info(f"Sha details data: {sha_details_data}")

        if division_data and 'id' in division_data:
            instance.division = Division.objects.get(id=division_data['id'])
        
        if subdivision_data and 'id' in subdivision_data:
            instance.subdivision = Subdivision.objects.get(id=subdivision_data['id'])
        
        instance = super().update(instance, validated_data)

        if instance.is_sha_worker:
            # Обновление или создание ShaWorkerDetails
            if sha_details_data:
                # Удаляем equipment_conclusions из sha_details_data, чтобы не передавать их в update_or_create
                equipment_conclusions_data = sha_details_data.pop('equipment_conclusions', [])
                logger.info(f"equipment_conclusions_data: {equipment_conclusions_data}")

                # Обновляем или создаем ShaWorkerDetails
                sha_details, created = ShaWorkerDetails.objects.update_or_create(
                    employee=instance,
                    defaults=sha_details_data
                    )
                logger.info(f"sha_details: {sha_details}")
                
                if equipment_conclusions_data:
                    # Удаляем существующие equipment_conclusions
                    sha_details.equipment_conclusions.all().delete()

                    # Создаем новые equipment_conclusions
                    for ec_data in equipment_conclusions_data:
                        ShaEquipmentConclusion.objects.create(sha_worker=sha_details, **ec_data)
        else:
            # Удаление ShaWorkerDetails, если is_sha_worker = False
            if hasattr(instance, 'sha_details'):
                instance.sha_details.delete()

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not instance.is_sha_worker:
            representation.pop('sha_details', None)
        return representation
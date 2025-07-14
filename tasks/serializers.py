from rest_framework import serializers

from facilities.models import Division, Subdivision
from .models import Task, TaskStep
from users.serializers import UserSerializer
from facilities.serializers import DivisionSerializer, SubdivisionSerializer

class TaskStepSerializer(serializers.ModelSerializer):
    completed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskStep
        fields = [
            'id', 'name', 'comments', 'start_date', 'end_date',
            'is_completed', 'completed_by', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_by', 'completed_at']

class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, required=False)
    created_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    progress = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

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
        allow_null=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'division', 'subdivision',
            'division_id', 'subdivision_id', 'created_by', 'steps', 
            'progress', 'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'is_completed']

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_progress(self, obj):
        return obj.progress

    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        task = Task.objects.create(**validated_data)
        
        for step_data in steps_data:
            TaskStep.objects.create(task=task, **step_data)
            
        return task

    def update(self, instance, validated_data):     
        if 'division' in validated_data:
            instance.division = validated_data.pop('division')
        if 'subdivision' in validated_data:
        # Получаем значение subdivision
            subdivision = validated_data.pop('subdivision')
        # Устанавливаем null только если получено значение None
            instance.subdivision = subdivision
        
        # Остальная логика обновления
        steps_data = validated_data.pop('steps', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if steps_data is not None:
            instance.steps.all().delete()
            for step_data in steps_data:
                TaskStep.objects.create(task=instance, **step_data)
                
        return instance
    
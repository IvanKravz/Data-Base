from rest_framework import serializers
from facilities.models import Division, Subdivision
from .models import Task, TaskStep
from users.serializers import UserSerializer
from facilities.serializers import DivisionSerializer, SubdivisionSerializer
import logging

logger = logging.getLogger(__name__)

class TaskStepSerializer(serializers.ModelSerializer):
    completed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskStep
        fields = [
            'id', 'name', 'comments', 'start_date', 'end_date',
            'is_completed', 'completed_by', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_by', 'completed_at', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, required=False)
    created_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    progress = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_private = serializers.BooleanField()

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
            'progress', 'is_completed', 'created_at', 'updated_at',
            'is_private' 
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'is_completed']

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_progress(self, obj):
        return obj.progress

    def create(self, validated_data):
        logger.info(f"Creating task with validated data: {validated_data}")
        
        steps_data = validated_data.pop('steps', [])
        
        # Проверяем, что division присутствует
        if 'division' not in validated_data:
            raise serializers.ValidationError({"division_id": "Это поле обязательно."})

        # Устанавливаем текущего пользователя как создателя задачи
        validated_data['created_by'] = self.context['request'].user

        task = Task.objects.create(**validated_data)
        
        for step_data in steps_data:
            TaskStep.objects.create(task=task, **step_data)
            
        return task

    def update(self, instance, validated_data):     
        if 'division' in validated_data:
            instance.division = validated_data.pop('division')
        if 'subdivision' in validated_data:
            subdivision = validated_data.pop('subdivision')
            instance.subdivision = subdivision
        if 'is_private' in validated_data:
            instance.is_private = validated_data.pop('is_private')
        
        steps_data = validated_data.pop('steps', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if steps_data is not None:
            self._update_steps(instance, steps_data)
                    
        return instance
    
    def _update_steps(self, instance, steps_data):
        """Обновляет этапы задачи, сохраняя выполненные этапы"""
        existing_steps = {str(step.id): step for step in instance.steps.all()}
        updated_step_ids = set()
        
        for step_data in steps_data:
            step_id = step_data.get('id')
            
            # Пропускаем этапы с временными ID (None или нечисловые значения)
            if step_id is None:
                # Создаем новый этап без ID
                TaskStep.objects.create(task=instance, **step_data)
                continue
                
            try:
                step_id_str = str(step_id)
                if step_id_str in existing_steps:
                    # Обновляем существующий этап
                    step_instance = existing_steps[step_id_str]
                    for attr, value in step_data.items():
                        if attr != 'id':  # Не обновляем ID
                            setattr(step_instance, attr, value)
                    step_instance.save()
                    updated_step_ids.add(step_id_str)
                else:
                    # Создаем новый этап с указанным ID
                    TaskStep.objects.create(task=instance, **step_data)
            except (ValueError, TypeError):
                # Если ID невалидный, создаем новый этап
                step_data_without_id = {k: v for k, v in step_data.items() if k != 'id'}
                TaskStep.objects.create(task=instance, **step_data_without_id)
        
        # Удаляем этапы, которых нет в обновленных данных
        for step_id, step_instance in existing_steps.items():
            if step_id not in updated_step_ids:
                step_instance.delete()
    
    def validate(self, data):
        """
        Проверка прав на изменение приватных задач и обязательных полей
        """
        instance = self.instance
        user = self.context['request'].user
        
        # Проверка при создании - division обязателен
        if not instance and 'division' not in data:
            raise serializers.ValidationError({
                "division_id": "Это поле обязательно при создании задачи."
            })
        
        # Проверка при обновлении
        if instance and instance.is_private:
            if instance.created_by != user:
                raise serializers.ValidationError(
                    "Вы не можете изменять приватные задачи других пользователей"
                )
        
        # Проверка при создании
        if 'is_private' in data and data['is_private']:
            if not user.is_authenticated:
                raise serializers.ValidationError(
                    "Только авторизованные пользователи могут создавать приватные задачи"
                )
        
        return data
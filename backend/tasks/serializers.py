from rest_framework import serializers
from facilities.models import Division, Subdivision
from .models import Task, TaskStep
from users.serializers import UserSerializer
from facilities.serializers import DivisionSerializer, SubdivisionSerializer
from employees.models import Employee
import logging

logger = logging.getLogger(__name__)


class AssigneeBriefSerializer(serializers.ModelSerializer):
    """
    Краткая карточка сотрудника для отображения в задаче.
    Не тянет лишние поля Employee (фото, допуски и т.п.).
    """
    division = serializers.SerializerMethodField()
    subdivision = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'position', 'rank', 'division', 'subdivision']

    def get_division(self, obj):
        if obj.division:
            return {'id': obj.division.id, 'name': obj.division.name}
        return None

    def get_subdivision(self, obj):
        if obj.subdivision:
            return {'id': obj.subdivision.id, 'name': obj.subdivision.name}
        return None


class TaskStepSerializer(serializers.ModelSerializer):
    completed_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskStep
        fields = [
            'id', 'name', 'comments', 'start_date', 'end_date',
            'is_completed', 'completed_by', 'completed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['completed_by', 'completed_at', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, required=False)
    created_by = UserSerializer(read_only=True)
    assignee = AssigneeBriefSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    progress = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_private = serializers.BooleanField()

    division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        source='division',
        write_only=True,
        required=True,
    )
    subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(),
        source='subdivision',
        write_only=True,
        allow_null=True,
        required=False,
    )
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='assignee',
        write_only=True,
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'division', 'subdivision',
            'division_id', 'subdivision_id',
            'created_by', 'assignee', 'assignee_id',
            'steps', 'progress', 'is_completed',
            'created_at', 'updated_at', 'is_private',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'is_completed']

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_progress(self, obj):
        return obj.progress

    def create(self, validated_data):
        logger.info(f"Creating task with validated data: {validated_data}")

        steps_data = validated_data.pop('steps', [])

        if 'division' not in validated_data:
            raise serializers.ValidationError({'division_id': 'Это поле обязательно.'})

        validated_data['created_by'] = self.context['request'].user

        task = Task.objects.create(**validated_data)

        for step_data in steps_data:
            TaskStep.objects.create(task=task, **step_data)

        return task

    def update(self, instance, validated_data):
        if 'division' in validated_data:
            instance.division = validated_data.pop('division')
        if 'subdivision' in validated_data:
            instance.subdivision = validated_data.pop('subdivision')
        if 'is_private' in validated_data:
            instance.is_private = validated_data.pop('is_private')
        if 'assignee' in validated_data:
            instance.assignee = validated_data.pop('assignee')

        steps_data = validated_data.pop('steps', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if steps_data is not None:
            self._update_steps(instance, steps_data)

        return instance

    def _update_steps(self, instance, steps_data):
        """Обновляет этапы задачи, сохраняя выполненные этапы."""
        existing_steps = {str(step.id): step for step in instance.steps.all()}
        updated_step_ids = set()

        for step_data in steps_data:
            step_id = step_data.get('id')

            if step_id is None:
                TaskStep.objects.create(task=instance, **step_data)
                continue

            try:
                step_id_str = str(step_id)
                if step_id_str in existing_steps:
                    step_instance = existing_steps[step_id_str]
                    for attr, value in step_data.items():
                        if attr != 'id':
                            setattr(step_instance, attr, value)
                    step_instance.save()
                    updated_step_ids.add(step_id_str)
                else:
                    TaskStep.objects.create(task=instance, **step_data)
            except (ValueError, TypeError):
                step_data_without_id = {k: v for k, v in step_data.items() if k != 'id'}
                TaskStep.objects.create(task=instance, **step_data_without_id)

        for step_id, step_instance in existing_steps.items():
            if step_id not in updated_step_ids:
                step_instance.delete()

    def validate(self, data):
        instance = self.instance
        user = self.context['request'].user

        if not instance and 'division' not in data:
            raise serializers.ValidationError({
                'division_id': 'Это поле обязательно при создании задачи.',
            })

        if instance and instance.is_private:
            if instance.created_by != user:
                raise serializers.ValidationError(
                    'Вы не можете изменять приватные задачи других пользователей'
                )

        if 'is_private' in data and data['is_private']:
            if not user.is_authenticated:
                raise serializers.ValidationError(
                    'Только авторизованные пользователи могут создавать приватные задачи'
                )

        # Проверка, что assignee принадлежит выбранному подразделению
        # (или хотя бы существует). Это защита от передачи чужого ID.
        assignee = data.get('assignee')
        division = data.get('division') or getattr(instance, 'division', None)
        subdivision = data.get('subdivision') or getattr(instance, 'subdivision', None)
        if assignee and division:
            if assignee.division_id and assignee.division_id != division.id:
                raise serializers.ValidationError({
                    'assignee_id': 'Исполнитель должен относиться к выбранному подразделению',
                })
            if subdivision and assignee.subdivision_id and assignee.subdivision_id != subdivision.id:
                # Мягкая проверка: если у сотрудника отделение не совпадает,
                # не блокируем, но логируем. Если хотите строго — раскомментируйте raise.
                logger.warning(
                    "Assignee %s subdivision=%s doesn't match task subdivision=%s",
                    assignee.id, assignee.subdivision_id, subdivision.id,
                )
                # raise serializers.ValidationError({
                #     'assignee_id': 'Исполнитель должен относиться к выбранному отделению',
                # })

        return data
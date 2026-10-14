"""
Сериализаторы для модуля «Кандидаты».

Разделение:
  - CandidateListSerializer    — короткий список (таблица)
  - CandidateDetailSerializer  — карточка + все этапы
  - CandidateWriteSerializer   — создание/редактирование карточки
  - CandidateStageSerializer   — один этап (inline-PATCH)
  - HireSerializer             — конвертация в сотрудника

Поддержка режима «другое подразделение»:
  - В write-сериализатор добавлены поля `custom_division_name`,
    `custom_curator_name`.
  - В read-сериализаторы добавлены read-only поля `division_display` и
    `curator_display`, которые возвращают либо данные из справочника, либо
    кастомные значения. UI использует их для отображения.

Год архива/отказа:
  - Поле `status_changed_at` — момент последней смены статуса.
  - Поле `status_year` — год этого момента (int) для статусов
    `rejected` / `archived`. Для остальных статусов — `null`.
    Используется в UI для бейджа года и фильтра «Все годы / 2026 / 2025…».
"""

from rest_framework import serializers

from employees.models import Employee
from facilities.models import Division
from facilities.serializers import EmployeeBriefSerializer

from .models import (
    Candidate, CandidateStage,
    CandidateStatus, Phase, StageType, StageStatus,
    STAGE_SEQUENCE,
)

# Статусы, для которых имеет смысл показывать/фильтровать год
YEAR_STATUSES = (CandidateStatus.REJECTED, CandidateStatus.ARCHIVED)


class DivisionBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name']


class CandidateStageSerializer(serializers.ModelSerializer):
    stage_type_display = serializers.CharField(
        source='get_stage_type_display', read_only=True,
    )
    phase_display = serializers.CharField(
        source='get_phase_display', read_only=True,
    )
    status_display = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    planned_date = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y', 'iso-8601'],
        allow_null=True, required=False,
    )
    actual_date = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y', 'iso-8601'],
        allow_null=True, required=False,
    )

    class Meta:
        model = CandidateStage
        fields = [
            'id', 'stage_type', 'stage_type_display',
            'phase', 'phase_display', 'order',
            'planned_date', 'actual_date',
            'status', 'status_display', 'is_overdue',
            'comment',
        ]
        read_only_fields = [
            'id', 'stage_type', 'stage_type_display',
            'phase', 'phase_display', 'order',
        ]

    def get_status_display(self, obj) -> str:
        if obj.is_overdue:
            return 'Просрочен'
        return obj.get_status_display()

    def update(self, instance, validated_data):
        if 'actual_date' in validated_data and validated_data['actual_date']:
            validated_data.setdefault('status', StageStatus.DONE)
        return super().update(instance, validated_data)


# ---------------------------------------------------------------------- #
# Общий миксин для read-сериализаторов                                    #
# ---------------------------------------------------------------------- #

class CandidateReadMixin:
    """Общие методы для list/detail сериализаторов."""

    def get_division_display(self, obj) -> str | None:
        if obj.division:
            return obj.division.name
        return obj.custom_division_name or None

    def get_curator_display(self, obj) -> str | None:
        if obj.curator:
            return obj.curator.full_name
        return obj.custom_curator_name or None

    def get_progress(self, obj) -> dict:
        stages = list(obj.stages.all())
        total = len(stages)
        done = sum(1 for s in stages if s.status == StageStatus.DONE)
        return {'done': done, 'total': total}

    def get_overdue_count(self, obj) -> int:
        return sum(1 for s in obj.stages.all() if s.is_overdue)

    def get_status_year(self, obj) -> int | None:
        """
        Год события «Отказ» / «Архив».

        Отдаём год только для статусов rejected/archived — для active/hired
        год смысла не имеет (активный кандидат «в работе» сейчас, а не в
        каком-то году).
        """
        if obj.status in YEAR_STATUSES and obj.status_changed_at:
            return obj.status_changed_at.year
        return None


# ---------------------------------------------------------------------- #
# Кандидат — список                                                       #
# ---------------------------------------------------------------------- #

class CandidateListSerializer(CandidateReadMixin, serializers.ModelSerializer):
    curator = EmployeeBriefSerializer(read_only=True)
    division = DivisionBriefSerializer(read_only=True)

    division_display = serializers.SerializerMethodField()
    curator_display = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )
    status_year = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    overdue_count = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'number', 'full_name', 'planned_position', 'phone',
            'curator', 'curator_display',
            'division', 'division_display',
            'custom_division_name', 'custom_curator_name',
            'status', 'status_display',
            'status_changed_at',
            'status_year',
            'progress', 'overdue_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['status_changed_at', 'status_year']


# ---------------------------------------------------------------------- #
# Кандидат — детали                                                       #
# ---------------------------------------------------------------------- #

class CandidateDetailSerializer(CandidateReadMixin, serializers.ModelSerializer):
    curator = EmployeeBriefSerializer(read_only=True)
    division = DivisionBriefSerializer(read_only=True)

    division_display = serializers.SerializerMethodField()
    curator_display = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )
    status_year = serializers.SerializerMethodField()
    stages = CandidateStageSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    overdue_count = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'number', 'full_name', 'planned_position', 'phone',
            'curator', 'curator_display',
            'division', 'division_display',
            'custom_division_name', 'custom_curator_name',
            'note',
            'status', 'status_display',
            'status_changed_at',
            'status_year',
            'stages', 'progress', 'overdue_count',
            'hired_employee',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'number', 'division', 'hired_employee',
            'status_changed_at', 'status_year',
            'created_at', 'updated_at',
        ]


# ---------------------------------------------------------------------- #
# Кандидат — запись                                                       #
# ---------------------------------------------------------------------- #

class CandidateWriteSerializer(serializers.ModelSerializer):
    number = serializers.IntegerField(read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'number', 'full_name', 'planned_position', 'phone',
            'curator', 'division',
            'custom_division_name', 'custom_curator_name',
            'note', 'status',
        ]
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'note': {'required': False, 'allow_blank': True, 'allow_null': True},
            'curator': {'required': False, 'allow_null': True},
            'division': {'required': False, 'allow_null': True},
            'custom_division_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'custom_curator_name': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_status(self, value):
        """
        Статус `hired` выставляется ТОЛЬКО через action `hire`.
        Через обычный create/update его установить нельзя.
        """
        if value == CandidateStatus.HIRED:
            raise serializers.ValidationError(
                'Статус «Принят» устанавливается только действием '
                '«Принять на службу».'
            )
        return value

    def validate(self, attrs):
        """Инварианты режима «другое подразделение»."""
        custom_div = (attrs.get('custom_division_name') or '').strip() or None
        custom_cur = (attrs.get('custom_curator_name') or '').strip() or None

        if bool(custom_div) != bool(custom_cur):
            raise serializers.ValidationError({
                'custom_division_name': (
                    'Поля «Подразделение (вручную)» и «Куратор (вручную)» '
                    'должны быть заполнены одновременно.'
                ),
            })

        if custom_div:
            attrs['curator'] = None
            attrs['division'] = None

        attrs['custom_division_name'] = custom_div
        attrs['custom_curator_name'] = custom_cur

        if self.instance is not None and self.instance.status == CandidateStatus.HIRED:
            new_status = attrs.get('status', self.instance.status)
            if new_status != CandidateStatus.HIRED:
                raise serializers.ValidationError({
                    'status': (
                        'Нельзя изменить статус принятого кандидата. '
                        'Он уже стал сотрудником.'
                    ),
                })
        return attrs


# ---------------------------------------------------------------------- #
# Hire                                                                    #
# ---------------------------------------------------------------------- #

class HireSerializer(serializers.Serializer):
    """
    Минимальный набор полей для конвертации кандидата в сотрудника.
    Всё остальное (ФИО, должность, телефон) берётся из кандидата.
    """
    division = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        required=False, allow_null=True,
    )
    category = serializers.ChoiceField(
        choices=Employee.CATEGORY_CHOICES,
        default='civilian',
    )
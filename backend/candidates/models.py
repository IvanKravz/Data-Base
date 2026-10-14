"""
Модели для учёта кандидатов на службу.

Candidate       — карточка кандидата.
CandidateStage  — один из 33 этапов прохождения кандидатом.

Этапы создаются автоматически при создании кандидата (post_save signal).
Статус `overdue` (просрочен) НЕ хранится в БД — вычисляется в сериализаторе.

Поля `custom_division_name` / `custom_curator_name` — сценарий «сотрудник
другого подразделения»: если они заполнены, `division` и `curator` должны
быть пустыми (инвариант обеспечивается в save()).
"""

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


# ====================================================================== #
# Справочники (TextChoices)                                              #
# ====================================================================== #

class CandidateStatus(models.TextChoices):
    ACTIVE = 'active', 'В работе'
    HIRED = 'hired', 'Принят'
    REJECTED = 'rejected', 'Отказ'
    ARCHIVED = 'archived', 'Архив'


class Phase(models.TextChoices):
    PRIMARY = 'primary', 'Первичное оформление'
    COORDINATION = 'coordination', 'Согласование и направление'
    MEDICAL = 'medical', 'Медицина и психодиагностика'
    CHECKS = 'checks', 'Проверки и справки'
    INTERVIEWS = 'interviews', 'Собеседования и поручения'
    ATTESTATION = 'attestation', 'Аттестация и завершение'


class StageType(models.TextChoices):
    ENROLLMENT_MONTH = 'enrollment_month', 'Планируемый месяц зачисления в году'
    INITIAL_REPORT = 'initial_report', 'Составление первичной справки'
    TALK_CHIEF = 'talk_chief', 'Справка о беседе с главным руководителем'
    APPLICATION = 'application', 'Заявление от кандидата'

    OSB_APPROVAL = 'osb_approval', 'Согласование материалов с ОСБ'
    SEND_TO_HR = 'send_to_hr', 'Направление материалов в ОК, О(Ц)К'
    REFERRAL_PFO_VVK = 'referral_pfo_vvk', 'Выдача направления на ПФО, ВВК'

    PFO = 'pfo', 'Прохождение ПФО'
    TESTING = 'testing', 'Тестирование'
    PSYCHOLOGIST = 'psychologist', 'Психолог'
    POLYGRAPH = 'polygraph', 'Полиграф'
    PFO_CONCLUSION = 'pfo_conclusion', 'Получение заключения ПФО'
    VVK_START = 'vvk_start', 'Начало прохождения ВВК'
    VVK_CONCLUSION = 'vvk_conclusion', 'Получение заключения ВВК'

    FP_TEST = 'fp_test', 'Зачет по ФП'
    TWO_REFERENCES = 'two_references', 'Два отзыва на кандидата'
    PARENTS_TALK = 'parents_talk', 'О беседе с родителями (супругом (ой))'
    HOBBIES_REPORT = 'hobbies_report', 'Справка об увлечениях и интересах'
    OTKS_SEARCH = 'otks_search', 'Справка по результатам поиска в ОТКС'
    CLOSE_CONTACTS = 'close_contacts', 'Список близких (дружеских) связей'
    SPEC_CHECK_START = 'spec_check_start', 'Начало спецпроверки'
    SPEC_CHECK_END = 'spec_check_end', 'Окончание спецпроверки'
    AWARENESS_REPORT = 'awareness_report', 'Справка об осведомленности кандидата'
    TASK_ISSUE = 'task_issue', 'Выдача поручения'

    PRACTICAL_TASK = 'practical_task', 'Выполнение практического задания'
    TASK_RESULT = 'task_result', 'Справка по результатам поручения'
    TALK_SSSI = 'talk_sssi', 'Справка о беседе с руководством СССИ'
    TALK_OSB = 'talk_osb', 'Справка о беседе с руководством ОСБ'
    TALK_HR = 'talk_hr', 'Справка о беседе с руководством ОК'
    SUMMARY_REPORT = 'summary_report', 'Обобщенная справка'
    TALK_MANAGEMENT = 'talk_management', 'Справка о беседе с руководством Управления'

    ATTESTATION = 'attestation', 'Представление кандидата на аттестационную комиссию'
    SEND_TO_UK_SOKR = 'send_to_uk_sokr', 'Направление дела в УК СОКР'


class StageStatus(models.TextChoices):
    PENDING = 'pending', 'Ожидает'
    DONE = 'done', 'Выполнен'
    SKIPPED = 'skipped', 'Пропущен'


STAGE_SEQUENCE = [
    (StageType.ENROLLMENT_MONTH, Phase.PRIMARY, 1),
    (StageType.INITIAL_REPORT, Phase.PRIMARY, 2),
    (StageType.TALK_CHIEF, Phase.PRIMARY, 3),
    (StageType.APPLICATION, Phase.PRIMARY, 4),

    (StageType.OSB_APPROVAL, Phase.COORDINATION, 5),
    (StageType.SEND_TO_HR, Phase.COORDINATION, 6),
    (StageType.REFERRAL_PFO_VVK, Phase.COORDINATION, 7),

    (StageType.PFO, Phase.MEDICAL, 8),
    (StageType.TESTING, Phase.MEDICAL, 9),
    (StageType.PSYCHOLOGIST, Phase.MEDICAL, 10),
    (StageType.POLYGRAPH, Phase.MEDICAL, 11),
    (StageType.PFO_CONCLUSION, Phase.MEDICAL, 12),
    (StageType.VVK_START, Phase.MEDICAL, 13),
    (StageType.VVK_CONCLUSION, Phase.MEDICAL, 14),

    (StageType.FP_TEST, Phase.CHECKS, 15),
    (StageType.TWO_REFERENCES, Phase.CHECKS, 16),
    (StageType.PARENTS_TALK, Phase.CHECKS, 17),
    (StageType.HOBBIES_REPORT, Phase.CHECKS, 18),
    (StageType.OTKS_SEARCH, Phase.CHECKS, 19),
    (StageType.CLOSE_CONTACTS, Phase.CHECKS, 20),
    (StageType.SPEC_CHECK_START, Phase.CHECKS, 21),
    (StageType.SPEC_CHECK_END, Phase.CHECKS, 22),
    (StageType.AWARENESS_REPORT, Phase.CHECKS, 23),
    (StageType.TASK_ISSUE, Phase.CHECKS, 24),

    (StageType.PRACTICAL_TASK, Phase.INTERVIEWS, 25),
    (StageType.TASK_RESULT, Phase.INTERVIEWS, 26),
    (StageType.TALK_SSSI, Phase.INTERVIEWS, 27),
    (StageType.TALK_OSB, Phase.INTERVIEWS, 28),
    (StageType.TALK_HR, Phase.INTERVIEWS, 29),
    (StageType.SUMMARY_REPORT, Phase.INTERVIEWS, 30),
    (StageType.TALK_MANAGEMENT, Phase.INTERVIEWS, 31),

    (StageType.ATTESTATION, Phase.ATTESTATION, 32),
    (StageType.SEND_TO_UK_SOKR, Phase.ATTESTATION, 33),
]

STAGE_TYPE_TO_PHASE = {st: ph for st, ph, _ in STAGE_SEQUENCE}
STAGE_TYPE_TO_ORDER = {st: order for st, _, order in STAGE_SEQUENCE}


# ====================================================================== #
# Модели                                                                 #
# ====================================================================== #

class Candidate(models.Model):
    """
    Карточка кандидата на службу.

    Поле `number` — автоинкремент и одновременно первичный ключ.

    Режимы куратора:
      - Справочник: `curator` заполнен, `division` синхронизируется с
        `curator.division`. Кастомные поля пустые.
      - Другое подразделение: `custom_division_name` и
        `custom_curator_name` заполнены (инвариант — оба), а `curator` и
        `division` пустые.

    Инвариант поддерживается в save().
    """

    number = models.BigAutoField(primary_key=True, verbose_name='Номер')
    full_name = models.CharField(max_length=150, verbose_name='ФИО')
    planned_position = models.CharField(
        max_length=256, verbose_name='Планируемая должность',
    )
    phone = models.CharField(
        max_length=50, verbose_name='Телефон', blank=True, null=True,
    )
    curator = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='curated_candidates',
        verbose_name='Закреплённый сотрудник',
    )
    division = models.ForeignKey(
        'facilities.Division',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='candidates',
        verbose_name='Подразделение',
    )

    # === Режим «другое подразделение» ===
    custom_division_name = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name='Подразделение (вручную)',
        help_text='Используется, если куратор не из справочника.',
    )
    custom_curator_name = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name='Куратор (вручную)',
        help_text='ФИО куратора, если его нет в справочнике сотрудников.',
    )

    note = models.TextField(
        verbose_name='Примечания', blank=True, null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=CandidateStatus.choices,
        default=CandidateStatus.ACTIVE,
        verbose_name='Статус',
        db_index=True,
    )

    # Дата последней смены статуса. Проставляется автоматически в save().
    # Используется в UI для отображения периода (года) событий
    # «Принят» / «Отказ» / «Архив».
    status_changed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Дата смены статуса',
        db_index=True,
    )

    hired_employee = models.OneToOneField(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='source_candidate',
        verbose_name='Принятый сотрудник',
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Кандидат'
        verbose_name_plural = 'Кандидаты'
        ordering = ['number']
        indexes = [
            models.Index(fields=['status'], name='cand_status_idx'),
            models.Index(fields=['division'], name='cand_division_idx'),
            models.Index(fields=['full_name'], name='cand_fullname_idx'),
            models.Index(fields=['status_changed_at'], name='cand_status_changed_idx'),
        ]

    def __str__(self):
        return f'№{self.number} — {self.full_name}'

    def save(self, *args, **kwargs):
        """
        Инварианты:
          - Если задан хотя бы один из `custom_*` — оба должны быть заданы,
            а `division` и `curator` обнуляются.
          - Иначе `division` синхронизируется с `curator.division`.
          - `status_changed_at` обновляется при смене статуса
            (и при создании — фиксирует «стартовый» статус).
        """
        custom_div = (self.custom_division_name or '').strip()
        custom_cur = (self.custom_curator_name or '').strip()

        if custom_div or custom_cur:
            self.custom_division_name = custom_div or None
            self.custom_curator_name = custom_cur or None
            self.division_id = None
            self.curator_id = None
        else:
            self.custom_division_name = None
            self.custom_curator_name = None
            if self.curator_id and self.curator and self.curator.division_id:
                self.division_id = self.curator.division_id
            else:
                self.division_id = None

        # Обновляем status_changed_at только если статус реально изменился
        # (или это первичное сохранение).
        if self.pk:
            try:
                old_status = (
                    Candidate.objects
                    .filter(pk=self.pk)
                    .values_list('status', flat=True)
                    .first()
                )
            except Exception:
                old_status = None
            if old_status is not None and old_status != self.status:
                self.status_changed_at = timezone.now()
        else:
            # Создание — фиксируем момент появления записи
            if not self.status_changed_at:
                self.status_changed_at = timezone.now()

        super().save(*args, **kwargs)


class CandidateStage(models.Model):
    """Один этап прохождения кандидатом."""

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='stages',
        verbose_name='Кандидат',
    )
    stage_type = models.CharField(
        max_length=32,
        choices=StageType.choices,
        verbose_name='Тип этапа',
    )
    phase = models.CharField(
        max_length=20,
        choices=Phase.choices,
        verbose_name='Фаза',
    )
    order = models.PositiveSmallIntegerField(verbose_name='Порядок')
    planned_date = models.DateField(
        null=True, blank=True, verbose_name='Планируемая дата',
    )
    actual_date = models.DateField(
        null=True, blank=True, verbose_name='Фактическая дата',
    )
    status = models.CharField(
        max_length=16,
        choices=StageStatus.choices,
        default=StageStatus.PENDING,
        verbose_name='Статус',
    )
    comment = models.TextField(
        blank=True, null=True, verbose_name='Комментарий',
    )

    class Meta:
        verbose_name = 'Этап кандидата'
        verbose_name_plural = 'Этапы кандидата'
        ordering = ['order']
        unique_together = ('candidate', 'stage_type')
        indexes = [
            models.Index(fields=['candidate', 'order']),
            models.Index(fields=['phase']),
        ]

    def __str__(self):
        return f'{self.candidate.full_name} — {self.get_stage_type_display()}'

    @property
    def is_overdue(self) -> bool:
        if self.status in (StageStatus.DONE, StageStatus.SKIPPED):
            return False
        if self.actual_date:
            return False
        if not self.planned_date:
            return False
        return self.planned_date < timezone.now().date()


# ====================================================================== #
# Авто-создание 33 этапов при создании кандидата                         #
# ====================================================================== #

@receiver(post_save, sender=Candidate)
def create_candidate_stages(sender, instance, created, **kwargs):
    """При создании кандидата создаём 33 этапа в статусе `pending`."""
    if not created:
        return
    if instance.stages.exists():
        return
    CandidateStage.objects.bulk_create([
        CandidateStage(
            candidate=instance,
            stage_type=stage_type,
            phase=phase,
            order=order,
            status=StageStatus.PENDING,
        )
        for stage_type, phase, order in STAGE_SEQUENCE
    ])
# equipment/management/commands/add_equipment_categories.py
import re
from django.core.management.base import BaseCommand
from equipment.models import Equipment, EquipmentCategory


# Порядок важен: специфичные паттерны раньше общих.
DEVICE_TYPE_PATTERNS = [
    ('patch-panel',       r'\b(patch[\s-]?panel|патч[\s-]?панель)\b'),
    ('media-converter',   r'\b(media[\s-]?converter|медиаконвертер)\b'),
    ('firewall',          r'\b(firewall|межсетев\w*\s*экран|pix|asa|fortigate|user ?gateway|сзи)\b'),
    ('router',            r'\b(router|маршрутизатор|isr\s*\d|asr\s*\d|cisco\s*\d{3,4}|eltex\s*\d{4})\b'),
    ('switch',            r'\b(switch|коммутатор|catalyst|nexus|sg\d|sf\d|esr)\b'),
    ('server',            r'\b(server|сервер|poweredge|proliant|super ?micro)\b'),
    ('workstation',       r'\b(workstation|арм|пк\b|pc\b|desktop|системный блок)\b'),
    ('pbx',               r'\b(pbx|атс|уатс|мини[\s-]?атс)\b'),
    ('modem',             r'\b(modem|модем|adsl|xdsl)\b'),
]


class Command(BaseCommand):
    help = (
        'Актуализирует справочник категорий техники и (по умолчанию) '
        'заполняет device_type у сетевого оборудования по type/name.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-device-types', action='store_true',
            help='Не заполнять device_type (только категории).',
        )
        parser.add_argument(
            '--force-device-types', action='store_true',
            help='Перезаписать device_type даже у уже заполненных.',
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Показать изменения без сохранения.',
        )

    def handle(self, *args, **options):
        self._ensure_categories(dry_run=options['dry_run'])

        if not options['skip_device_types']:
            self._backfill_device_types(
                dry_run=options['dry_run'],
                force=options['force_device_types'],
            )

    # ------------------------------------------------------------------ #
    def _ensure_categories(self, dry_run: bool) -> None:
        categories_data = [
            {'value': 'tko',            'name': 'Телеком. оборудование',              'is_closed': False},
            {'value': 'analog',         'name': 'Аппаратура проводной связи',         'is_closed': False},
            {'value': 'shd',            'name': 'ШДтехника',                          'is_closed': True},
            {'value': 'radio',          'name': 'Радио, спутник',                     'is_closed': False},
            {'value': 'computer',       'name': 'СВТ',                                'is_closed': False},
            {'value': 'antenna',        'name': 'Антенны, мачты',                     'is_closed': False},
            {'value': 'power',          'name': 'Источники питания, агрегаты',        'is_closed': False},
            {'value': 'battery',        'name': 'АКБ',                                'is_closed': False},
            {'value': 'cabel',          'name': 'Кабель, провода',                    'is_closed': False},
            {'value': 'material',       'name': 'Материалы',                          'is_closed': False},
            {'value': 'furniture',      'name': 'Мебель и оборудование',              'is_closed': False},
            {'value': 'telephone',      'name': 'Телефонные аппараты, факсы',         'is_closed': False},
            {'value': 'shdTelephone',   'name': 'Спец. телефонные аппараты, факсы',   'is_closed': True},
            {'value': 'mobileTelephone','name': 'Сотовые телефоны',                   'is_closed': False},
            {'value': 'car',            'name': 'Автомобильная техника',              'is_closed': False},
            {'value': 'szi',            'name': 'Средства защиты информации (СЗИ)',   'is_closed': False},
        ]

        for item in categories_data:
            if dry_run:
                exists = EquipmentCategory.objects.filter(value=item['value']).exists()
                verb = 'Обновлена' if exists else 'Создана'
                self.stdout.write(f'[dry-run] {verb}: {item["name"]} ({item["value"]})')
                continue

            obj, created = EquipmentCategory.objects.update_or_create(
                value=item['value'],
                defaults={'name': item['name'], 'is_closed': item['is_closed']},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'Создана категория: {obj.name} (код: {obj.value})'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Обновлена категория: {obj.name} (код: {obj.value})'
                ))

    # ------------------------------------------------------------------ #
    def _backfill_device_types(self, dry_run: bool, force: bool) -> None:
        qs = Equipment.objects.filter(is_network=True)
        if not force:
            qs = qs.filter(device_type__isnull=True)

        changed = 0
        for eq in qs.iterator():
            haystack = f'{eq.type or ""} {eq.name or ""}'.lower()
            for code, pattern in DEVICE_TYPE_PATTERNS:
                if not re.search(pattern, haystack, flags=re.IGNORECASE):
                    continue

                if dry_run:
                    self.stdout.write(
                        f'[dry-run] {eq.id}: {eq.name!r} → {code}'
                    )
                else:
                    eq.device_type = code
                    eq.save(update_fields=['device_type'])
                    self.stdout.write(f'{eq.id}: {eq.name!r} → {code}')
                changed += 1
                break

        if dry_run:
            self.stdout.write(self.style.NOTICE(
                f'DRY RUN: будет обновлено {changed} ед. оборудования'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'device_type заполнен у {changed} ед. оборудования'
            ))
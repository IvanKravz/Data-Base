# map/management/commands/import_fsb_offices.py
import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from map.models import FSBOffice, RUSSIAN_REGIONS

class Command(BaseCommand):
    help = 'Импорт данных ФСБ из JSON файла'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Путь к JSON файлу с данными (относительно корня проекта)'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Обновить существующие записи'
        )
    
    def handle(self, *args, **options):
        file_path = options.get('file')
        update_existing = options.get('update', False)
        
        # Если путь не указан, используем файл в директории команды
        if not file_path:
            command_dir = os.path.dirname(__file__)
            file_path = os.path.join(command_dir, 'fsb_offices_for_import.json')
        
        # Если указан относительный путь, делаем его абсолютным относительно корня проекта
        elif not os.path.isabs(file_path):
            from django.conf import settings
            file_path = os.path.join(settings.BASE_DIR, file_path)
        
        self.stdout.write(f"Поиск файла: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'Файл {file_path} не найден')
            )
            self.stdout.write(
                self.style.WARNING('Проверьте путь к файлу или используйте --file для указания пути')
            )
            return
        except json.JSONDecodeError:
            self.stdout.write(
                self.style.ERROR(f'Ошибка чтения JSON файла {file_path}')
            )
            return
        
        self.stdout.write(f'Найдено {len(data)} записей для импорта')
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        with transaction.atomic():
            for office_data in data:
                # Проверяем валидность региона
                valid_regions = [code for code, name in RUSSIAN_REGIONS]
                if office_data.get('region') not in valid_regions:
                    self.stdout.write(
                        self.style.WARNING(f"Пропущен офис {office_data.get('name')} - невалидный регион: {office_data.get('region')}")
                    )
                    skipped_count += 1
                    continue
                
                # Проверяем обязательные поля
                if not all([office_data.get('name'), office_data.get('region'), office_data.get('phone_operator')]):
                    self.stdout.write(
                        self.style.WARNING(f"Пропущен офис - отсутствуют обязательные поля: {office_data.get('name')}")
                    )
                    skipped_count += 1
                    continue
                
                # Создаем или обновляем запись
                defaults = {
                    'address': office_data.get('address', ''),
                    'phone_operator': office_data.get('phone_operator', ''),
                    'phone_communication': office_data.get('phone_communication', office_data.get('phone_operator', '')),
                    'fax': office_data.get('fax', ''),
                    'email': office_data.get('email', ''),
                    'description': office_data.get('description', ''),
                    'is_active': True
                }
                
                if update_existing:
                    obj, created = FSBOffice.objects.update_or_create(
                        name=office_data['name'],
                        region=office_data['region'],
                        defaults=defaults
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"Создан: {office_data['name']}")
                        )
                    else:
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(f"Обновлен: {office_data['name']}")
                        )
                else:
                    obj, created = FSBOffice.objects.get_or_create(
                        name=office_data['name'],
                        region=office_data['region'],
                        defaults=defaults
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"Создан: {office_data['name']}")
                        )
                    else:
                        skipped_count += 1
                        self.stdout.write(
                            self.style.WARNING(f"Пропущен (дубликат): {office_data['name']}")
                        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Импорт завершен: создано {created_count}, '
                f'обновлено {updated_count}, пропущено {skipped_count}'
            )
        )
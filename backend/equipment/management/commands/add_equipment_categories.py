# equipment/management/commands/add_equipment_categories.py
from django.core.management.base import BaseCommand
from equipment.models import EquipmentCategory

class Command(BaseCommand):
    help = 'Добавляет или обновляет категории техники'

    def handle(self, *args, **options):
        categories_data = [
            {'value': 'tko', 'name': 'Телекоммуникационное оборудование', 'is_closed': False},
            {'value': 'analog', 'name': 'Аппаратура проводной связи', 'is_closed': False},
            {'value': 'shd', 'name': 'ШДтехника', 'is_closed': True},
            {'value': 'radio', 'name': 'Радио, спутник', 'is_closed': False},
            {'value': 'computer', 'name': 'СВТ', 'is_closed': False},
            {'value': 'antenna', 'name': 'Антенны, мачты', 'is_closed': False},
            {'value': 'power', 'name': 'Источники питания, агрегаты', 'is_closed': False},
            {'value': 'battery', 'name': 'АКБ', 'is_closed': False},
            {'value': 'cabel', 'name': 'Кабель, провода', 'is_closed': False},
            {'value': 'material', 'name': 'Материалы', 'is_closed': False},
            {'value': 'furniture', 'name': 'Мебель и оборудование', 'is_closed': False},
            {'value': 'telephone', 'name': 'Телефонные аппараты, факсы', 'is_closed': False},
            {'value': 'shdTelephone', 'name': 'Специальные телефонные аппараты, факсы', 'is_closed': True},
            {'value': 'mobileTelephone', 'name': 'Сотовые телефоны', 'is_closed': False},
            {'value': 'car', 'name': 'Автомобильная техника', 'is_closed': False},
        ]

        for item in categories_data:
            obj, created = EquipmentCategory.objects.update_or_create(
                value=item['value'],
                defaults={
                    'name': item['name'],
                    'is_closed': item['is_closed']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Создана категория: {obj.name} (код: {obj.value})'))
            else:
                self.stdout.write(self.style.WARNING(f'Обновлена категория: {obj.name} (код: {obj.value})'))
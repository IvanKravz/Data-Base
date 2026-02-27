# management/commands/create_facility_types.py
from django.core.management.base import BaseCommand
from facilities.models import FacilityType

class Command(BaseCommand):
    help = 'Создаёт или обновляет типы объектов, учитывая закрытые типы (Станция, ШД)'

    def handle(self, *args, **options):
        # Переименовываем устаревший тип "ШО" в "ШД" и делаем его закрытым
        try:
            old_sho = FacilityType.objects.get(name='ШО')
            old_sho.name = 'ШД'
            old_sho.description = ''  # при необходимости можно очистить описание
            old_sho.is_closed_type = True
            old_sho.save()
            self.stdout.write(self.style.WARNING('Переименован тип "ШО" в "ШД" и установлен как закрытый'))
        except FacilityType.DoesNotExist:
            pass

        # Данные для всех типов объектов
        types_data = [
            {'name': 'ЛАЗ', 'description': 'Линейно-аппаратный зал', 'is_closed_type': False},
            {'name': 'ПДрЦ', 'description': 'Передающий радиоцентр', 'is_closed_type': False},
            {'name': 'ПРЦ', 'description': 'Приемный радиоцентр', 'is_closed_type': False},
            {'name': 'Спутниковая станция', 'description': '', 'is_closed_type': False},
            {'name': 'Станция', 'description': '', 'is_closed_type': True},
            {'name': 'ШД', 'description': '', 'is_closed_type': True},
            {'name': 'Дизельная', 'description': '', 'is_closed_type': False},
            {'name': 'Радиорелейная станция', 'description': '', 'is_closed_type': False},
        ]

        for item in types_data:
            obj, created = FacilityType.objects.update_or_create(
                name=item['name'],
                defaults={
                    'description': item['description'],
                    'is_closed_type': item['is_closed_type']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'Создан тип: {obj.name} (закрытый: {obj.is_closed_type})'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Обновлён тип: {obj.name} (закрытый: {obj.is_closed_type})'
                ))
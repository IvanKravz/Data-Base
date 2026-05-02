from django.core.management.base import BaseCommand
from facilities.models import Facility
from facilities.geocoder import AddressGeocoder

class Command(BaseCommand):
    help = 'Обновляет координаты для всех объектов Facility, у которых они отсутствуют'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Принудительно обновить координаты для всех объектов (даже если они уже есть)',
        )

    def handle(self, *args, **options):
        force = options['force']
        geocoder = AddressGeocoder()
        
        # Выбираем объекты
        if force:
            facilities = Facility.objects.exclude(address__isnull=True).exclude(address='')
            self.stdout.write(f'Принудительное обновление координат для {facilities.count()} объектов')
        else:
            facilities = Facility.objects.filter(
                latitude__isnull=True,
                longitude__isnull=True
            ).exclude(address__isnull=True).exclude(address='')
            self.stdout.write(f'Найдено объектов без координат: {facilities.count()}')
        
        updated = 0
        failed = 0
        
        for facility in facilities:
            self.stdout.write(f'Обработка: {facility.name} ({facility.address})')
            coords = geocoder.geocode(facility.address)
            if coords:
                facility.latitude = coords[0]
                facility.longitude = coords[1]
                facility.save(update_fields=['latitude', 'longitude'])
                updated += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Координаты найдены: {coords}'))
            else:
                failed += 1
                self.stdout.write(self.style.WARNING(f'  ✗ Координаты не найдены'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nГотово! Обновлено: {updated}, не найдено: {failed}'
        ))
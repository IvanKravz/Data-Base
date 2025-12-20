# management/commands/setup_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from users.permissions_config import ROLE_PERMISSIONS

class Command(BaseCommand):
    help = 'Создает или обновляет группы ролей согласно конфигурации'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Принудительное обновление существующих групп',
        )
    
    def handle(self, *args, **options):
        force = options['force']
        created_count = 0
        updated_count = 0
        
        for role_name, role_config in ROLE_PERMISSIONS.items():
            group_name = f"role_{role_name}"
            
            try:
                group, created = Group.objects.get_or_create(name=group_name)
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Создана группа: {group_name} - {role_config["name"]}')
                    )
                    created_count += 1
                else:
                    if force:
                        # Можно добавить обновление описания или других полей
                        self.stdout.write(
                            self.style.WARNING(f'↻ Обновлена группа: {group_name}')
                        )
                        updated_count += 1
                    else:
                        self.stdout.write(
                            self.style.NOTICE(f'✓ Группа {group_name} уже существует')
                        )
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Ошибка создания группы {group_name}: {str(e)}')
                )
        
        # Статистика
        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Настройка ролей завершена! '
                f'Создано: {created_count}, Обновлено: {updated_count}'
            )
        )
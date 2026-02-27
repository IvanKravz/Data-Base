# management/commands/add_divisions.py
import random
from django.core.management.base import BaseCommand
from facilities.models import Division, Subdivision

class Command(BaseCommand):
    help = 'Добавляет тестовые отделы (Division) и отделения (Subdivision) с правильным порядком и рандомным штатом'

    def handle(self, *args, **options):
        # Полный список подразделений в нужном порядке
        # Каждый элемент: (название отдела, список отделений внутри)
        ordered_divisions = [
            ('1 отдел', ['1 отделение', '2 отделение', '3 отделение']),
            ('2 отдел', ['1 отделение', '2 отделение']),
            ('3 отделение', []),   # отдел без отделений
            ('4 отдел', ['1 отделение', '2 отделение']),
            ('5 отдел', ['1 отделение', '2 отделение']),
            ('6 отделение', []),
            ('7 отделение', []),
            ('8 отделение', []),
            ('9 отдел', []),
            ('10 отделение', []),
            ('11 отделение', []),
            ('12 отделение', []),
            ('13 отделение', []),
            ('14 отделение', []),
        ]

        def distribute(total, parts):
            """
            Распределяет целое число total случайным образом на parts частей.
            Возвращает список целых чисел, сумма которых равна total.
            """
            if total < 0:
                raise ValueError("total не может быть отрицательным")
            if parts <= 0:
                return []
            result = [0] * parts
            for _ in range(total):
                result[random.randrange(parts)] += 1
            return result

        def random_staff_numbers(total):
            """
            Генерирует словарь с плановыми показателями штата для одного подразделения
            (руководство, офицеры, прапорщики, гражданские) так, чтобы их сумма равнялась total.
            """
            mgmt, off, warrant, civilian = distribute(total, 4)
            return {
                'staff_planned_total': total,
                'staff_planned_management': mgmt,
                'staff_planned_officers': off,
                'staff_planned_warrant_officers': warrant,
                'staff_planned_civilian': civilian,
            }

        # Проходим по всем отделам в заданном порядке
        for div_index, (div_name, sub_names) in enumerate(ordered_divisions, start=1):
            # Генерируем общий штат отдела (от 20 до 80)
            total_division = random.randint(20, 80)
            num_subs = len(sub_names)

            # Распределяем общий штат между отделениями (если они есть)
            if num_subs > 0:
                sub_totals = distribute(total_division, num_subs)
            else:
                sub_totals = []

            # Создаём или обновляем отдел с правильным order
            division_defaults = random_staff_numbers(total_division)
            division_defaults['order'] = div_index   # устанавливаем порядок отдела
            division, created = Division.objects.update_or_create(
                name=div_name,
                defaults=division_defaults
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Создан отдел: {div_name} (order={div_index})'))
            else:
                self.stdout.write(self.style.WARNING(f'Отдел {div_name} обновлён (order={div_index})'))

            # Если есть отделения, создаём/обновляем их с правильным порядком внутри отдела
            if num_subs > 0:
                accumulated = {
                    'staff_planned_total': 0,
                    'staff_planned_management': 0,
                    'staff_planned_officers': 0,
                    'staff_planned_warrant_officers': 0,
                    'staff_planned_civilian': 0,
                }

                for sub_index, (sub_name, sub_total) in enumerate(zip(sub_names, sub_totals), start=1):
                    sub_staff = random_staff_numbers(sub_total)
                    sub_staff['order'] = sub_index   # порядок внутри отдела
                    subdivision, sub_created = Subdivision.objects.update_or_create(
                        name=sub_name,
                        division=division,
                        defaults=sub_staff
                    )
                    if sub_created:
                        self.stdout.write(self.style.SUCCESS(f'  Создано отделение: {sub_name} (order={sub_index})'))
                    else:
                        self.stdout.write(self.style.WARNING(f'  Отделение {sub_name} обновлено (order={sub_index})'))

                    # Суммируем для последующего обновления отдела
                    for key in accumulated:
                        accumulated[key] += sub_staff.get(key, 0)

                # После создания всех отделений обновляем отдел суммой их штатов
                Division.objects.filter(id=division.id).update(**accumulated)
                self.stdout.write(self.style.SUCCESS(f'  Отдел {div_name} обновлён: сумма отделений = {accumulated["staff_planned_total"]}'))

            else:
                # Если отделений нет, отдел уже создан с правильным штатом
                self.stdout.write(self.style.SUCCESS(f'  Отдел без отделений: {div_name}, штат = {total_division}'))
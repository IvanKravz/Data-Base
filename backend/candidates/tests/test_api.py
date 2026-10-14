"""
Интеграционные тесты API модуля «Кандидаты».

Проверяем:
  - Авто-создание 33 этапов при создании.
  - Ролевые фильтры (leader / exploitation_chief / tech_section_1_1).
  - Inline-редактирование этапа + автостатус `done` при actual_date.
  - Action `hire`.
  - Action `stats`, `dictionaries`, `export` (csv/xlsx).
"""

from rest_framework import status
from rest_framework.test import APITestCase

from employees.models import Employee
from candidates.models import (
    Candidate, CandidateStage, CandidateStatus, StageStatus, STAGE_SEQUENCE,
)
from .helpers import make_user, make_division, make_employee


class CandidateAPITests(APITestCase):

    def setUp(self):
        self.division_a = make_division('Division A')
        self.division_b = make_division('Division B')
        self.curator_a = make_employee('Куратор A', division=self.division_a)
        self.curator_b = make_employee('Куратор B', division=self.division_b)

        self.admin = make_user('admin_user', 'admin')
        self.hr = make_user('hr_user', 'hr_section_1_1')
        self.leader = make_user('leader_user', 'leader')
        self.expl_chief = make_user('chief_user', 'exploitation_chief', division=self.division_a)
        self.tech = make_user('tech_user', 'tech_section_1_1')

        self.list_url = '/api/candidates/'

    # ---------- Хелперы ---------- #

    def _create_candidate(self, full_name='Петров П.П.', curator=None, division=None):
        return Candidate.objects.create(
            full_name=full_name,
            planned_position='Инженер',
            curator=curator,
            division=division,
        )

    # ---------- Create ---------- #

    def test_create_creates_33_stages(self):
        self.client.force_authenticate(self.hr)
        resp = self.client.post(self.list_url, {
            'full_name': 'Петров П.П.',
            'planned_position': 'Инженер',
            'curator': self.curator_a.id,
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # Ответ — полный detail-объект (патч из предыдущего шага)
        self.assertIn('number', resp.data)
        self.assertIn('stages', resp.data)
        self.assertEqual(len(resp.data['stages']), 33)

        c = Candidate.objects.get(pk=resp.data['number'])
        self.assertEqual(c.stages.count(), 33)
        self.assertEqual(c.division, self.division_a)  # auto из куратора
        # Порядок этапов совпадает со STAGE_SEQUENCE
        orders = list(c.stages.values_list('order', flat=True))
        self.assertEqual(orders, list(range(1, 34)))

    def test_create_denied_for_leader(self):
        self.client.force_authenticate(self.leader)
        resp = self.client.post(self.list_url, {
            'full_name': 'Петров П.П.',
            'planned_position': 'Инженер',
        }, format='json')
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST))

    def test_create_denied_for_tech_employee(self):
        self.client.force_authenticate(self.tech)
        resp = self.client.post(self.list_url, {
            'full_name': 'Петров П.П.',
            'planned_position': 'Инженер',
        }, format='json')
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST))

    # ---------- List + фильтры ---------- #

    def test_leader_sees_all_candidates(self):
        self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self._create_candidate('B', curator=self.curator_b, division=self.division_b)

        self.client.force_authenticate(self.leader)
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_exploitation_chief_sees_only_own_division(self):
        self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self._create_candidate('B', curator=self.curator_b, division=self.division_b)

        self.client.force_authenticate(self.expl_chief)
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['full_name'], 'A')

    def test_tech_employee_sees_nothing(self):
        self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self.client.force_authenticate(self.tech)
        resp = self.client.get(self.list_url)
        # У tech_section_1_1 нет прав на Candidate — 403
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_by_status(self):
        c1 = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self._create_candidate('B', curator=self.curator_a, division=self.division_a)
        c1.status = CandidateStatus.REJECTED
        c1.save()

        self.client.force_authenticate(self.hr)
        resp = self.client.get(f'{self.list_url}?status=rejected')
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['full_name'], 'A')

    def test_search_by_full_name(self):
        self._create_candidate('Петров П.П.', curator=self.curator_a, division=self.division_a)
        self._create_candidate('Сидоров С.С.', curator=self.curator_a, division=self.division_a)

        self.client.force_authenticate(self.hr)
        resp = self.client.get(f'{self.list_url}?search=Сидоров')
        self.assertEqual(len(resp.data), 1)

    # ---------- Inline-редактирование этапа ---------- #

    def test_stage_update_by_hr(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        stage = c.stages.first()

        self.client.force_authenticate(self.hr)
        url = f'/api/candidates/{c.number}/stages/{stage.id}/'
        resp = self.client.patch(url, {'planned_date': '01-06-2026'}, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['planned_date'], '01-06-2026')
        stage.refresh_from_db()
        self.assertEqual(str(stage.planned_date), '2026-06-01')

    def test_stage_update_auto_done_on_actual_date(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        stage = c.stages.first()

        self.client.force_authenticate(self.hr)
        url = f'/api/candidates/{c.number}/stages/{stage.id}/'
        resp = self.client.patch(url, {'actual_date': '01-06-2026'}, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'done')

    def test_stage_update_denied_for_leader(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        stage = c.stages.first()

        self.client.force_authenticate(self.leader)
        url = f'/api/candidates/{c.number}/stages/{stage.id}/'
        resp = self.client.patch(url, {'planned_date': '01-06-2026'}, format='json')
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST))

    def test_stage_is_overdue_computed(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        stage = c.stages.first()
        stage.planned_date = '2020-01-01'
        stage.save()

        self.client.force_authenticate(self.hr)
        resp = self.client.get(f'/api/candidates/{c.number}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        stage_data = next(s for s in resp.data['stages'] if s['id'] == stage.id)
        self.assertTrue(stage_data['is_overdue'])
        self.assertEqual(stage_data['status_display'], 'Просрочен')

    # ---------- Hire ---------- #

    def test_hire_creates_employee(self):
        c = self._create_candidate(
            'Сидоров С.С.', curator=self.curator_a, division=self.division_a,
        )
        c.phone = '+7-900-000-00-00'
        c.save()

        self.client.force_authenticate(self.hr)
        url = f'/api/candidates/{c.number}/hire/'
        resp = self.client.post(url, {
            'division': self.division_a.id,
            'category': 'civilian',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', resp.data)

        c.refresh_from_db()
        self.assertEqual(c.status, CandidateStatus.HIRED)
        self.assertIsNotNone(c.hired_employee_id)
        self.assertEqual(c.hired_employee.full_name, 'Сидоров С.С.')
        self.assertEqual(c.hired_employee.division, self.division_a)

    def test_hire_twice_fails(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self.client.force_authenticate(self.hr)
        url = f'/api/candidates/{c.number}/hire/'

        r1 = self.client.post(url, {'division': self.division_a.id, 'category': 'civilian'}, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post(url, {'division': self.division_a.id, 'category': 'civilian'}, format='json')
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hire_denied_for_leader(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        self.client.force_authenticate(self.leader)
        resp = self.client.post(
            f'/api/candidates/{c.number}/hire/',
            {'division': self.division_a.id, 'category': 'civilian'},
            format='json',
        )
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST))

    # ---------- Stats ---------- #

    def test_stats_returns_aggregates(self):
        c = self._create_candidate('A', curator=self.curator_a, division=self.division_a)
        stage = c.stages.first()
        stage.planned_date = '2020-01-01'
        stage.save()

        self.client.force_authenticate(self.hr)
        resp = self.client.get('/api/candidates/stats/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total'], 1)
        self.assertEqual(resp.data['overdue_count'], 1)

    # ---------- Dictionaries ---------- #

    def test_dictionaries_returns_33_stages_and_6_phases(self):
        self.client.force_authenticate(self.hr)
        resp = self.client.get('/api/candidates/dictionaries/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['stages']), 33)
        self.assertEqual(len(resp.data['phases']), 6)
        self.assertEqual(len(resp.data['statuses']), 4)

    # ---------- Export ---------- #

    def test_export_csv(self):
        self._create_candidate('Петров П.П.', curator=self.curator_a, division=self.division_a)
        self.client.force_authenticate(self.hr)
        resp = self.client.get('/api/candidates/export/?fmt=csv')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', resp['Content-Type'])
        body = resp.content.decode('utf-8-sig')
        self.assertIn('ФИО', body)
        self.assertIn('Петров', body)

    def test_export_xlsx(self):
        self._create_candidate('Петров П.П.', curator=self.curator_a, division=self.division_a)
        self.client.force_authenticate(self.hr)
        resp = self.client.get('/api/candidates/export/?fmt=xlsx')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('spreadsheetml', resp['Content-Type'])

    def test_export_invalid_format_returns_400(self):
        self.client.force_authenticate(self.hr)
        resp = self.client.get('/api/candidates/export/?fmt=pdf')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
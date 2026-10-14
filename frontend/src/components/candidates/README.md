# Модуль «Кандидаты»

Учёт кандидатов на службу с графиком прохождения 33 этапов.

## Модели

- **Candidate** — карточка кандидата (`number`, `full_name`, `planned_position`,
  `phone`, `curator` → Employee, `division` (авто из `curator.division`),
  `note`, `status`, `hired_employee`).
- **CandidateStage** — один из 33 этапов; при создании кандидата они
  создаются автоматически через `post_save`-signal. Поля: `stage_type`,
  `phase`, `order`, `planned_date`, `actual_date`, `status`, `comment`.
  Просрочка (`is_overdue`) вычисляется, в БД не хранится.

## API

Все эндпоинты доступны по префиксу `/api/candidates/`.

| Метод  | URL                                       | Назначение                  |
|--------|-------------------------------------------|-----------------------------|
| GET    | `/`                                       | Список с фильтрами          |
| POST   | `/`                                       | Создать (33 этапа сразу)    |
| GET    | `/{number}/`                              | Детали + этапы              |
| PATCH  | `/{number}/`                              | Обновить карточку           |
| DELETE | `/{number}/`                              | Удалить                     |
| PATCH  | `/{number}/stages/{stage_id}/`            | Inline-правка этапа         |
| POST   | `/{number}/hire/`                         | Конвертация в Employee      |
| GET    | `/stats/`                                 | Агрегаты                    |
| GET    | `/dictionaries/`                          | Справочники этапов/фаз      |
| GET    | `/export/?format=csv\|xlsx`               | Экспорт                     |

### Фильтры списка

- `?status=active|hired|rejected|archived`
- `?division=<id>`
- `?curator=<id>`
- `?search=<ФИО / должность / телефон>`
- `?ordering=number|full_name|division__name|created_at|status`
  (префикс `-` для убывания)

### Inline-правка этапа

`PATCH /api/candidates/{number}/stages/{stage_id}/`

```json
{
  "planned_date": "15-06-2026",
  "actual_date":  "20-06-2026",
  "status":       "done",
  "comment":      "Заключение получено"
}
# 🚀 Быстрый старт для локальной разработки

## 1. Настройка окружения

```bash
# Клонируйте проект (если нужно)
git clone <ваш-репозиторий>
cd backend

# Установите зависимости
pip install -r requirements-dev.txt

# Настройте среду разработки
python setup_dev.py
```

## 2. База данных

```bash
# Создайте миграции
python manage.py makemigrations

# Примените миграции
python manage.py migrate

# Создайте суперпользователя
python manage.py createsuperuser
# Введите username, email и пароль


# Подключитесь к PostgreSQL как суперпользователь
psql -U postgres

# 1. Создать базу данных uzel (вы уже сделали)
psql -U postgres -c "CREATE DATABASE uzel;"

# 2. Создать пользователя для Django
psql -U postgres -c "CREATE USER django_user WITH PASSWORD 'SecurePass!123';"

# 3. Дать пользователю права на базу uzel
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE uzel TO django_user;"

# 4. (Опционально) Разрешить создавать тестовые БД для разработки
psql -U postgres -c "ALTER USER django_user CREATEDB;"

# Проверьте, что база создалась:

\l # (это покажет список всех баз данных)

# Выйдите из psql:

\q

# Можно выполнить всё одной командой, не заходя в интерактивный режим:

bash
psql -U postgres -c "CREATE DATABASE uzel;"

CREATE USER your_user WITH PASSWORD 'strong_password';

# Посмотреть список всех пользователей
psql -U postgres -c "\du"

# Или более детально
psql -U postgres -c "SELECT usename, usesuper, usecreatedb FROM pg_user;"

# Удалить пользователя (сначала нужно отозвать права)
psql -U postgres -c "DROP USER IF EXISTS django_equipment_user;"

# Затем создать заново
psql -U postgres -c "CREATE USER django_equipment_user WITH PASSWORD 'SecurePass!123';"

# Для предоставления прав 
Подключитесь к PostgreSQL под суперпользователем (например, postgres) и выполните следующие команды для базы данных uzel:

bash
psql -U postgres -d uzel -c "GRANT CREATE ON SCHEMA public TO django_user;"
psql -U postgres -d uzel -c "GRANT USAGE ON SCHEMA public TO django_user;"


Если вы хотите дать пользователю полный доступ ко всем текущим и будущим таблицам в схеме public, можно также выполнить:

# bash
# psql -U postgres -d uzel -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO django_user;"
# psql -U postgres -d uzel -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO django_user;"
# psql -U postgres -d uzel -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO django_user;"
# psql -U postgres -d uzel -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO django_user;"
# Но для первого запуска миграций достаточно первых двух команд.
```

## 3. Запуск сервера

```bash
python manage.py runserver 127.0.0.1:8000
```

## 4. Фронтенд (React/Vite):

```bash
cd frontend  # Перейдите в папку фронтенда
npm install
npm run dev

# Будет доступен на: http://localhost:5173
```

## Почему PostgreSQL?

# Безопасность: Поддержка ролей, SSL-соединений, расширенных прав доступа и шифрования данных.

 # Надёжность: Журналирование, механизмы восстановления после сбоев, поддержка конкурентных записей без блокировок.

# Асинхронность: Совместимость с асинхронными драйверами (asyncpg) и ASGI-серверами для реализации неблокирующих операций.

# Хранение файлов: Хотя файлы лучше хранить вне базы (S3, файловая система), PostgreSQL может хранить их метаданные с гарантией целостности, а также поддерживает большие бинарные объекты (BLOB) через BinaryField, если это действительно необходимо.

Для повышения безопасности:
1) Включите SSL (настройте сертификаты).
2) Используйте надёжные пароли и ограничьте доступ по IP.
3) Регулярно обновляйте PostgreSQL.
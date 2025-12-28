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
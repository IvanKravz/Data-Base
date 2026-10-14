# Dockerfile backend

FROM python:3.12-slim

# Системные зависимости для сборки psycopg2 и запуска приложения.
# libpq-dev нужен для компиляции psycopg2; gcc — для сборки расширений.
RUN apt-get update && apt-get install -y \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Рабочая директория внутри контейнера.
WORKDIR /app

# Устанавливаем зависимости отдельным слоем — так кэш не сбрасывается
# при изменении исходного кода, только при изменении requirements.txt.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код (включая entrypoint.sh и manage.py).
COPY . .

# entrypoint.sh должен быть исполняемым внутри контейнера.
# Абсолютный путь — на случай, если WORKDIR когда-нибудь изменится.
RUN chmod +x /app/entrypoint.sh

# Папки под статику и медиа. В dev/prod они монтируются как volume,
# но при первом запуске без volume папки должны существовать.
RUN mkdir -p /app/static /app/media

EXPOSE 8000

# Точка входа. Все шаги (migrate, collectstatic, сиды, суперпользователь)
# и запуск gunicorn/runserver выполняются внутри entrypoint.sh.
ENTRYPOINT ["/app/entrypoint.sh"]
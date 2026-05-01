# Dockerfile frontend
FROM node:22-alpine AS builder

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm cache clean --force && npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем только нужные файлы из public (исключая tiles и map)
COPY --from=builder /app/public/error-tile.png /usr/share/nginx/html/
COPY --from=builder /app/public/division-image.png /usr/share/nginx/html/

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
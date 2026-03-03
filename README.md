# VibeRide

## Стек проекта

- Next.js 16 + React 18 + TypeScript
- Prisma ORM
- PostgreSQL (локальная БД в Docker) / Supabase Postgres (демо-деплой)
- NextAuth.js (аутентификация)
- Tailwind CSS
- Zod

## Демо-деплой

Демонстрационная версия развернута через:
- Vercel (хостинг приложения)
- Supabase (облачная база данных)

Ссылка: https://vibe-ride.vercel.app/

## Запуск

1. Установите зависимости:
```bash
npm install
```

2. Соберите проект:
```bash
npm run build
```

3. Запустите приложение:
```bash
npm start
```

`npm start` автоматически:
- запускает локальный PostgreSQL в Docker (`docker compose up -d db`)
- применяет Prisma-схему к БД (`prisma db push`)
- заполняет БД мок-данными (пользователи/тренеры/сессии/история) (`prisma db seed`)
- запускает Next.js сервер

## Примечания

- Подключение к базе настраивается в `.env` через `POSTGRES_PRISMA_URL` (и опционально `POSTGRES_URL_NON_POOLING` для миграций).
- Перед `npm start` должен быть установлен и запущен Docker Desktop.

## Тестовые аккаунты (Demo)

1. Клиент
Role: client  
Email: client@viberide.local  
Password: Client123!  
Name: Demo Client

2. Администратор
Role: admin  
Email: admin@viberide.local  
Password: Admin123!  
Name: Demo Admin

3. Тренер
Role: trainer  
Email: trainer@viberide.local  
Password: Trainer123!  
Name: Demo Trainer

Примечание:  
Это тестовые учетные данные только для демонстрации и проверки.

# VibeRide

## Run

1. Install dependencies:
```bash
npm install
```

2. Build:
```bash
npm run build
```

3. Start:
```bash
npm start
```

`npm start` automatically:
- starts local PostgreSQL in Docker (`docker compose up -d db`)
- applies Prisma schema to DB (`prisma db push`)
- seeds mock users/trainers/sessions/history (`prisma db seed`)
- runs Next.js server

## Notes

- Database connection is configured in `.env` via `POSTGRES_PRISMA_URL` (and optionally `POSTGRES_URL_NON_POOLING` for migrations).
- Docker Desktop must be installed and running before `npm start`.

## Seed Schedule From CSV

To reseed only schedule (sessions + bookings) from `mockschedule.csv` starting from today:

```bash
npm run db:seed:schedule:csv
```

Defaults:
- `DAYS=10`
- `TZ_OFFSET=+03:00`
- `CAPACITY=20`

Optional overrides:

```bash
DAYS=10 TZ_OFFSET=+03:00 CAPACITY=20 npm run db:seed:schedule:csv
```

## Mock Accounts (Demo)

1) Client
Role: client
Email: client@viberide.local
Password: Client123!
Name: Demo Client

2) Admin
Role: admin
Email: admin@viberide.local
Password: Admin123!
Name: Demo Admin

3) Trainer
Role: trainer
Email: trainer@viberide.local
Password: Trainer123!
Name: Demo Trainer

Note:
These are mock credentials for testing/demo only.

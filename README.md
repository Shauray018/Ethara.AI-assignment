# Ethara.AI Assignment

Minimal full-stack project for project and task management.

## Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT auth
- Frontend: Next.js, React, TypeScript, shadcn/ui

## Architecture

- Auth: JWT-based authentication with login/signup endpoints
- Database: Prisma ORM connected to PostgreSQL
- API layer: Node.js + Express for auth, projects, tasks, dashboard, and users
- Frontend: Next.js app consuming the Express API
- UI: shadcn/ui components for forms, tables, dialogs, and layout

## Run locally

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
PORT=5000
```

Then run:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Then run:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

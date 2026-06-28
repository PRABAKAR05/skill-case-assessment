# SkillShorts - Mini Short-Video Learning Platform

SkillShorts is a full-stack short-video learning platform built for the Skillcase Intern Assessment. It provides a vertical shorts feed with authentication, likes, comments, bookmarks, local video serving, and a clean split between routes, controllers, services, middleware, and UI layers.

## Live Demo

Deployed demo: https://skillcase-assessment.vercel.app/

## Tech Stack

- Frontend: React, Vite, React Router, Redux Toolkit, Axios, Framer Motion
- Backend: Node.js, Express, PostgreSQL, JWT, bcrypt, Multer
- Database hosting: PostgreSQL on Supabase or Neon

## Assessment Coverage

- JWT authentication with register, login, and protected profile endpoint
- Password hashing with bcrypt
- Express auth middleware and centralized error middleware
- PostgreSQL schema with primary keys, foreign keys, composite keys, and category index
- Video endpoints for create, list, and detail views
- Like, comment, and bookmark endpoints
- Duplicate likes/bookmarks prevented by composite primary keys
- Transaction-based like toggling with atomic `like_count` updates
- Express static serving for local video files from `backend/uploads`
- React vertical scroll-snap shorts feed
- Autoplay when a video enters view using Intersection Observer
- Overlay actions for like, comment, and bookmark
- Slide-up comment sheet with Framer Motion
- Redux Toolkit authentication state
- Centralized Axios API client with JWT injection
- Loading, error, and empty states
- Video files and environment files excluded from git

## Project Structure

```text
skill-case/
  backend/
    models/
      schema.sql
    scripts/
      migrate.js
      seed-videos.js
    src/
      config/
      controllers/
      middlewares/
      routes/
      services/
      utils/
    uploads/
      .gitkeep
    server.js
  frontend/
    public/
    src/
      api/
      components/
      hooks/
      pages/
      redux/
      App.jsx
      main.jsx
      style.css
```

## Prerequisites

- Node.js 18 or newer
- PostgreSQL database URL from Supabase or Neon
- The three assessment video files downloaded locally

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Apply the database schema:

```bash
npm run migrate
```

Copy the three provided videos into `backend/uploads/`. The current seed script expects these filenames:

```text
Introduction_German.mp4
Learning_German.mp4
Story_German.mp4
```

Seed the video metadata:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

If the backend runs on a different URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Register a user |
| POST | `/auth/login` | No | Login and receive a JWT |
| GET | `/auth/me` | Yes | Get the current authenticated user |

### Videos

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/videos` | Yes | Create/upload a video record |
| GET | `/videos` | Optional | List shorts ordered by latest first |
| GET | `/videos/:id` | Optional | Get one short |
| POST | `/videos/:id/like` | Yes | Toggle like |
| POST | `/videos/:id/comment` | Yes | Add a comment |
| GET | `/videos/:id/comments` | No | List comments for a video |
| POST | `/videos/:id/bookmark` | Yes | Toggle bookmark |
| GET | `/videos/bookmarked/me` | Yes | List the user's saved videos |

## Run Checks

Build the frontend:

```bash
cd frontend
npm run build
```

Check backend startup after `.env` is configured:

```bash
cd backend
npm start
```

The health endpoint should respond with:

```json
{ "status": "ok" }
```

## Notes

- Do not commit `.env`, `node_modules`, `dist`, PDFs, images, or video files.
- The assessment videos must stay local under `backend/uploads`.
- The SQL schema is included at `backend/models/schema.sql`.

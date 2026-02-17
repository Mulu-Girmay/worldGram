# WorldGram

A Telegram-style real-time messaging application with:

- Private chats
- Groups (topics, permissions, admin controls, slow mode, livestream controls)
- Channels (posts, comments/discussion mode, reaction controls, mute/silent posting)
- Stories and profile management
- Socket-based real-time updates

## Tech Stack

- Frontend: React + Vite + Redux Toolkit + Tailwind
- Backend: Node.js + Express + Mongoose + Socket.IO
- Database: MongoDB

## Project Structure

- `frontend/`: web client
- `backend/`: API + socket server

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or hosted)

## Environment Variables

Copy these examples and adjust values:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

### Backend required vars

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Frontend important vars

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

## Install

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Run (Development)

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Build

Frontend production build:

```bash
cd frontend
npm run build
```

Backend runs directly with:

```bash
cd backend
npm start
```

## Deployment Notes

## API and Socket URLs

- Set `VITE_API_BASE_URL` to your deployed backend API base (for example `https://api.example.com/api`).
- Set `VITE_SOCKET_URL` to your backend socket origin (for example `https://api.example.com`).

## CORS

- Set `CORS_ORIGIN` in backend to your frontend origin(s), comma-separated.

Example:

```env
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

## Uploads

- Uploaded media is served from `/uploads`.
- Ensure persistent storage in production (volume mount/object storage strategy).

## Security and Hardening Checklist

- Use strong JWT secrets in production.
- Use HTTPS for both frontend and backend.
- Restrict `CORS_ORIGIN` to trusted origins only.
- Set `NODE_ENV=production` in backend.
- Rotate credentials and secrets before release.
- Add reverse proxy limits and WAF/rate limiting at infrastructure layer.
- Run DB backups and set monitoring/alerts.

## Validation Performed

- Backend syntax checks on updated controllers/models/routes.
- Frontend production build success via Vite.

## Known Follow-up Recommendations

- Add automated integration tests for core flows (auth/chat/group/channel/story).
- Add backend rate limiting middleware.
- Add centralized request validation (Joi/Zod/express-validator).
- Add CI pipeline for lint/build/test gates.

## Scripts (Current)

Backend:

- `npm run dev` - run with nodemon
- `npm start` - run server

Frontend:

- `npm run dev` - Vite dev server
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm run test` - Vitest

## License

ISC

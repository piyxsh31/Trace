# Trace — Personal Sheet Tracker

A web app that eliminates the friction of tracking personal sheets and tasks. Import your lists, track progress, and get visual analytics — all in one place.

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | Next.js (TypeScript)    |
| Styling    | Tailwind CSS            |
| Backend    | Node.js + Express       |
| Database   | MongoDB Atlas           |
| Auth       | Firebase (Google Sign-In) + JWT |

## Project Structure

```
Trace/
├── client/   # Next.js frontend
└── server/   # Express backend
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project with Google Sign-In enabled

### Backend

```bash
cd server
cp .env.example .env   # fill in your credentials
npm install
npm run dev            # starts on port 5000
```

### Frontend

```bash
cd client
cp .env.example .env   # fill in your Firebase config
npm install
npm run dev            # starts on port 3000
```

## Environment Variables

See `server/.env.example` and `client/.env.example` for all required variables.

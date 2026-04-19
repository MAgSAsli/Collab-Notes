# Collab Notes

A real-time collaborative note-taking app built with Next.js, Express, Socket.io, and PostgreSQL. Multiple users can edit the same document simultaneously with live presence indicators.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Tech Stack](https://img.shields.io/badge/Express-5-black?style=flat-square&logo=express)
![Tech Stack](https://img.shields.io/badge/Socket.io-4-black?style=flat-square&logo=socket.io)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=flat-square&logo=supabase)
![Tech Stack](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

## Features

- **Real-time collaboration** — multiple users editing the same document simultaneously via WebSocket
- **Live presence** — see who's currently viewing or editing a document
- **Authentication** — JWT-based register & login
- **Document management** — create, edit, delete documents
- **Share & invite** — invite collaborators by email
- **Auto-save** — changes are saved automatically with 1s debounce
- **Word count** — live word counter in the editor

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Real-time | Socket.io |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | JWT + bcryptjs |
| State | Zustand |
| HTTP Client | Axios |

## Project Structure

```
collab-notes/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   └── src/
│   │       ├── app/          # App Router pages
│   │       ├── lib/          # API & Socket helpers
│   │       └── store/        # Zustand auth store
│   └── server/               # Express backend
│       └── src/
│           ├── routes/       # Auth & document routes
│           ├── middleware/   # JWT auth middleware
│           └── lib/          # Prisma client
└── package.json              # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database (local or [Supabase](https://supabase.com))

### Installation

1. Clone the repository
```bash
git clone https://github.com/MAgSAsli/Collab-Notes.git
cd Collab-Notes
```

2. Install dependencies
```bash
npm install
cd apps/web && npm install
cd ../server && npm install
```

3. Configure environment variables

Create `apps/server/.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-secret-key"
CLIENT_URL="http://localhost:3000"
PORT=4000
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. Run database migrations
```bash
cd apps/server
npx prisma migrate dev
npx prisma generate
```

5. Start development servers

Backend:
```bash
cd apps/server && npm run dev
```

Frontend (new terminal):
```bash
cd apps/web && npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | Get all documents |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/:id` | Get document by ID |
| PATCH | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/documents/:id/share` | Share with user |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-document` | Client → Server | Join a document room |
| `document-change` | Client → Server | Broadcast content change |
| `title-change` | Client → Server | Broadcast title change |
| `document-update` | Server → Client | Receive content update |
| `title-update` | Server → Client | Receive title update |
| `active-users` | Server → Client | List of active users in room |

## License

MIT

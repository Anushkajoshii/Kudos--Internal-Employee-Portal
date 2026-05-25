# ✦ Kudos System

A full-stack internal employee recognition portal built with **Node.js + Express + SQLite** (backend) and **React** (frontend).

## Features

- 🎉 **Send kudos** to colleagues with a personalised message (max 500 chars)
- 📰 **Public feed** of all recent kudos with search and pagination
- 👤 **User profile** with kudos history, stats, and notifications
- 🔐 **JWT authentication** with role-based access (user / admin)
- 🛡 **Admin moderation** — hide, restore, or delete inappropriate kudos
- 🚩 **Report system** — users can report kudos for admin review
- 🔔 **Notifications** — in-app alerts when you receive kudos

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, better-sqlite3, JWT, bcryptjs |
| Frontend | React 18, CSS Variables (no UI library) |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT tokens, bcrypt password hashing |

## Quick Start

### 1. Backend

```bash
cd backend
npm install
node database/init.js      # Creates DB + seeds demo data
npm start                  # Runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                  # Runs on http://localhost:3000
```

> The frontend proxies API calls to `http://localhost:5000` via the `"proxy"` field in package.json.

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| alice@company.com | password123 | **Admin** |
| bob@company.com | password123 | User |
| carol@company.com | password123 | User |
| david@company.com | password123 | User |
| emma@company.com | password123 | User |

## Project Structure

```
kudos-system/
├── backend/
│   ├── database/
│   │   ├── init.js          # Schema creation + seed data
│   │   └── kudos.db         # SQLite DB (created on first run)
│   ├── middleware/
│   │   ├── auth.js          # JWT verify + requireAdmin
│   │   └── db.js            # Singleton DB connection
│   ├── routes/
│   │   ├── auth.js          # POST /login, /logout, GET /me
│   │   ├── kudos.js         # GET/POST /kudos
│   │   ├── users.js         # GET /users, /users/:id/kudos, /statistics
│   │   ├── moderation.js    # Admin hide/restore/delete
│   │   ├── reports.js       # User report + admin review
│   │   └── notifications.js # GET + mark-read
│   ├── server.js            # Express app entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth + authFetch
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── ProfilePage.js
│   │   │   └── AdminPage.js
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   ├── KudosForm.js
│   │   │   └── KudosFeed.js
│   │   ├── App.js
│   │   ├── styles.css
│   │   └── index.js
│   └── package.json
├── SPECIFICATION.md
└── README.md
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user info |

### Kudos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/kudos | Feed (paginated, searchable) |
| POST | /api/kudos | Create kudos |
| GET | /api/kudos/:id | Single kudos |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List colleagues (for dropdown) |
| GET | /api/users/:id | User profile |
| GET | /api/users/:id/kudos | Kudos history |
| GET | /api/users/:id/statistics | Stats |

### Moderation (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderation/queue | All kudos with status |
| POST | /api/moderation/:id/hide | Hide a kudos |
| POST | /api/moderation/:id/restore | Restore hidden kudos |
| DELETE | /api/moderation/:id | Permanently delete |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports/:kudosId/report | Report a kudos |
| GET | /api/reports | List reports (admin) |
| PUT | /api/reports/:id | Update report status |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | User notifications |
| PUT | /api/notifications/:id/read | Mark one as read |
| PUT | /api/notifications/read-all | Mark all as read |

## Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT with 24h expiry, signed with configurable secret
- Role-based access control (user/admin) on all protected routes  
- Rate limiting: 200 req/15min general, 20 req/15min for auth
- Helmet.js HTTP security headers
- Input validation on all endpoints
- SQL injection prevented via parameterised queries (better-sqlite3)

## Environment Variables

```env
PORT=5000
JWT_SECRET=your-secure-secret-here
FRONTEND_URL=http://localhost:3000
```

---
## Author
**Anushka Joshi**


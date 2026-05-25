# Kudos System Specification

## Functional Requirements

### User Stories

#### Core Kudos Functionality

1. **As a user**, I can select another user from a dropdown list of colleagues
2. **As a user**, I can write a message of appreciation (max 500 characters)
3. **As a user**, I can submit the kudos which gets stored in the database
4. **As a user**, I can view a feed of recent kudos on the dashboard
5. **As a user**, I can see my own kudos history and statistics

#### User Authentication and Management

6. **As a user**, I can log in with my company credentials
7. **As a user**, I can view my profile and kudos statistics
8. **As a user**, I can see who has given me kudos and when

#### Content Moderation

9. **As an administrator**, I can hide or delete inappropriate kudos messages
10. **As an administrator**, I can view all kudos for moderation purposes
11. **As an administrator**, I can restore hidden kudos if needed
12. **As a user**, I can report inappropriate kudos for review

#### Additional Features

13. **As a user**, I can search for kudos by recipient or sender
14. **As a user**, I can filter kudos by date range
15. **As a user**, I can receive notifications when someone gives me kudos

### Acceptance Criteria

#### User Story 1: User Selection
- Dropdown shows all active employees (excluding self)
- Users are sorted alphabetically by name
- Shows user's name and department
- Handles cases where no users are available

#### User Story 2: Message Creation
- Text area accepts up to 500 characters
- Real-time character count display
- Prevents submission of empty messages
- Supports basic formatting (line breaks)

#### User Story 3: Kudos Submission
- Stores kudos with timestamp, sender, recipient, and message
- Validates all required fields before submission
- Shows success confirmation message
- Handles submission errors gracefully

#### User Story 4: Kudos Feed
- Displays most recent kudos first (paginated, 20 per page)
- Shows sender, recipient, message, and timestamp
- Hides moderated kudos from regular users
- Responsive design for mobile and desktop

#### User Story 5: Personal History
- Shows kudos received and given separately
- Displays kudos statistics (total received, total given)
- Allows filtering by date range
- Shows kudos details on click

#### User Story 6: Authentication
- JWT-based authentication
- Maintains user session securely
- Handles login/logout gracefully
- Redirects unauthenticated users to login

#### User Story 7: User Profile
- Shows user's kudos statistics
- Displays recent kudos activity
- Shows department and join date

#### User Story 8: Kudos Received
- Lists all kudos received by the user
- Shows sender information and timestamp
- Allows sorting by date
- Includes message content

#### User Story 9: Content Moderation
- Admin can hide kudos (sets is_visible = false)
- Admin can permanently delete kudos
- Moderation actions are logged with admin ID and timestamp
- Hidden kudos are not visible to regular users

#### User Story 10: Admin Dashboard
- Shows all kudos with moderation controls
- Displays moderation status for each kudos
- Allows individual moderation actions
- Shows reports queue with pending count

#### User Story 11: Restore Functionality
- Admin can restore hidden kudos
- Restored kudos become visible to all users
- Restoration is logged with admin ID and timestamp

#### User Story 12: Report System
- Users can report inappropriate kudos
- Reports are queued for admin review
- Report includes reporter ID and reason
- Admins can resolve or dismiss reports

#### User Story 13: Search Functionality
- Search by recipient name or sender name
- Real-time search results
- Handles partial matches

#### User Story 14: Date Filtering
- Filter by date range
- Maintains filter state across page navigation

#### User Story 15: Notifications
- In-app notification badge
- Notification list with unread count
- Mark individual or all notifications as read

## Technical Design

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    join_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Kudos Table

```sql
CREATE TABLE kudos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    moderated_by INTEGER,
    moderated_at TIMESTAMP,
    moderation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (moderated_by) REFERENCES users(id)
);
```

#### Reports Table

```sql
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kudos_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kudos_id) REFERENCES kudos(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

#### Notifications Table

```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kudos_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (kudos_id) REFERENCES kudos(id)
);
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` — User login, returns JWT
- `POST /api/auth/logout` — User logout
- `GET /api/auth/me` — Get current user info

#### Kudos Management
- `GET /api/kudos` — List kudos (pagination, search, date filter)
- `POST /api/kudos` — Create new kudos
- `GET /api/kudos/:id` — Get specific kudos

#### User Management
- `GET /api/users` — List users for dropdown (excludes self)
- `GET /api/users/:id` — Get user profile
- `GET /api/users/:id/kudos` — Get user kudos history (sent/received)
- `GET /api/users/:id/statistics` — Get user kudos statistics

#### Moderation (Admin only)
- `GET /api/moderation/queue` — Get all kudos with moderation status
- `POST /api/moderation/:id/hide` — Hide a kudos
- `POST /api/moderation/:id/restore` — Restore hidden kudos
- `DELETE /api/moderation/:id` — Permanently delete kudos

#### Reports
- `POST /api/reports/:kudosId/report` — Report inappropriate kudos
- `GET /api/reports` — List all reports (admin only)
- `PUT /api/reports/:id` — Update report status (resolve/dismiss)

#### Notifications
- `GET /api/notifications` — Get user notifications with unread count
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read

### Frontend Components

#### Core Components
- `KudosForm` — Form for creating new kudos with user dropdown and character counter
- `KudosFeed` — Paginated feed of recent kudos with search
- `Sidebar` — Navigation with notification badge

#### Pages
- `LoginPage` — Authentication with demo account shortcuts
- `Dashboard` — Main page with KudosForm + KudosFeed
- `ProfilePage` — User stats, kudos history, notifications
- `AdminPage` — Moderation queue and reports management

### Security Considerations

#### Authentication & Authorization
- JWT-based authentication with 24h expiry
- Role-based access control (user/admin)
- bcrypt password hashing (salt rounds: 10)
- Configurable JWT secret via environment variable

#### Input Validation
- Server-side validation for all inputs
- Parameterised queries (no SQL injection)
- Message length enforcement (500 char max)
- Self-kudos prevention
- Duplicate report prevention

#### API Protection
- Rate limiting: 200 req/15min general, 20 req/15min auth
- Helmet.js security headers
- CORS configured to frontend origin only

### Performance Considerations
- Indexed foreign keys on kudos table
- Pagination (20 per page) for feed and history
- WAL mode for SQLite concurrent reads
- Efficient JOIN queries for feed with sender/recipient info

## Implementation Plan

### Phase 1: Core Backend
1. Database schema and init script with seed data
2. JWT authentication middleware
3. Kudos CRUD endpoints
4. User listing and profile endpoints

### Phase 2: Moderation Backend
1. Admin middleware (requireAdmin)
2. Moderation queue endpoint
3. Hide/restore/delete endpoints
4. Reports system (create, list, update)
5. Notifications system

### Phase 3: Frontend
1. Auth context and login page
2. Dashboard with KudosForm
3. KudosFeed with search and pagination
4. Profile page with stats and history
5. Admin panel with moderation controls

### Phase 4: Polish
1. Error handling and loading states
2. Empty states and responsive design
3. Notification badge and unread counts
4. README and deployment documentation

### Testing Strategy
- Manual testing of all user stories
- Test all API endpoints with valid and invalid inputs
- Test admin-only routes with non-admin tokens
- Test pagination edge cases
- Verify moderation visibility (hidden kudos not shown to users)

### Deployment Considerations
- Set `JWT_SECRET` environment variable to a strong random value
- Set `FRONTEND_URL` to the deployed frontend URL for CORS
- Run `node database/init.js` once on first deploy to create DB and seed data
- Build frontend with `npm run build` and serve static files or use separate host
- SQLite is suitable for small teams; migrate to PostgreSQL for scale

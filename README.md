# Hostel Room Allocation and Maintenance Request Portal

## 1. Project overview

HostelHub is a beginner-friendly full-stack web application for managing hostel rooms and maintenance requests. Students can create accounts, view room availability, request a room allocation, and submit maintenance problems. Wardens can manage rooms, view active allocations, and update maintenance request status.

### Problem statement
Manual hostel registers and paper maintenance complaints can make room allocation and issue tracking slow and difficult to monitor. This portal keeps these records in one database and gives students and wardens a simple dashboard.

## 2. Objectives

- Show hostel room availability.
- Allow students to request an available room.
- Prevent a student from having more than one active allocation.
- Allow students to submit maintenance requests.
- Allow wardens to update maintenance status.
- Give wardens room and allocation management tools.
- Store data persistently in Supabase PostgreSQL.

## 3. Roles

### Student
- Register/login.
- View rooms.
- Request an available room.
- Submit maintenance requests.
- View their own maintenance requests.

### Warden
- Login.
- View dashboard.
- Add/edit/delete rooms.
- View active allocations.
- Release allocations.
- View and update all maintenance requests.

## 4. Technology stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- Supabase PostgreSQL
- Git/GitHub
- npm packages: Express, Supabase JS, bcryptjs, dotenv, jsonwebtoken, helmet, express-rate-limit

## 5. Folder structure

```text
hostel-room-allocation-maintenance-portal/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── rooms.js
│   │   ├── allocations.js
│   │   └── maintenance.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── validation.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install:
1. Visual Studio Code: https://code.visualstudio.com/
2. Node.js LTS: https://nodejs.org/
3. Git: https://git-scm.com/
4. A Supabase account: https://supabase.com/

Verify in a terminal:
```bash
node -v
npm -v
git --version
```

## 7. Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Open `database/schema.sql`.
4. Copy the complete SQL.
5. Paste it into SQL Editor and click Run.
6. Open **Table Editor** and confirm these tables exist:
   - users
   - rooms
   - allocations
   - maintenance_requests
7. Go to **Project Settings → API**.
8. Copy the Project URL.
9. Copy the server-side service role key. Keep it private.

The service-role key must never be placed in frontend JavaScript or GitHub.

## 8. Environment configuration

Inside `backend/`, create `.env`:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
JWT_SECRET=PASTE_A_LONG_RANDOM_SECRET_HERE
```

For a strong JWT secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use the generated value for `JWT_SECRET`.

`.env` contains real local secrets and is ignored by Git. `.env.example` contains only safe placeholders and is committed.

## 9. Install dependencies

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
```

## 10. Start the application

From the `backend` directory:

```bash
npm start
```

Expected output:
```text
HostelHub running at http://localhost:3000
```

Open:
http://localhost:3000

The Express server serves the `frontend/` directory.

## 11. Application workflow

### Student
1. Register.
2. Login.
3. Open Rooms.
4. Choose an available room and request allocation.
5. Open Maintenance.
6. Submit a maintenance request.
7. Track its status.

### Warden
1. Register as a warden for this classroom/demo project.
2. Login.
3. View dashboard.
4. Manage rooms.
5. Open Allocations to see active student allocations.
6. Release an allocation when required.
7. Open Maintenance and change a request from pending to in progress or resolved.

For a real college system, warden accounts should be created or approved by an administrator rather than allowing public registration.

## 12. Architecture

```text
Browser
  │
  │ fetch()
  ▼
Express REST API
  │
  ├── Authentication middleware
  ├── Role authorization
  ├── Validation
  │
  ▼
Supabase PostgreSQL
  ├── users
  ├── rooms
  ├── allocations
  └── maintenance_requests
```

The browser never receives the Supabase service-role key.

## 13. API endpoints

| Method | Endpoint | Purpose | Role |
|---|---|---|---|
| POST | /api/auth/register | Create account | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/health | Health check | Public |
| GET | /api/dashboard | Dashboard statistics | Logged in |
| GET | /api/rooms | List rooms | Logged in |
| POST | /api/rooms | Add room | Warden |
| PATCH | /api/rooms/:id | Edit room | Warden |
| DELETE | /api/rooms/:id | Delete room | Warden |
| GET | /api/allocations | List active allocations | Warden |
| POST | /api/allocations | Request room allocation | Student |
| DELETE | /api/allocations/:id | Release allocation | Warden |
| GET | /api/maintenance | List maintenance requests | Logged in |
| POST | /api/maintenance | Create maintenance request | Student |
| PATCH | /api/maintenance/:id | Update request status | Warden |

Authenticated requests use:
```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## 14. Security

- Passwords are hashed with bcrypt.
- Login uses a signed JWT with an expiry.
- Private endpoints require authentication.
- Warden endpoints require the warden role.
- Backend validation is performed even if frontend validation exists.
- Helmet adds security-related HTTP headers.
- Rate limiting reduces excessive API requests.
- The Supabase service-role key stays server-side.
- RLS is enabled on database tables as defense-in-depth.
- The frontend escapes user-provided text before inserting it into HTML.

## 15. Testing checklist

### Authentication
- Register with valid details → account is created.
- Register with an existing email → error is shown.
- Login with wrong password → login is rejected.
- Login with valid credentials → dashboard opens.

### Rooms
- Warden adds a room → room appears.
- Warden edits a room → details update.
- Student filters rooms → matching rooms are shown.
- Full room → allocation request is rejected.

### Allocations
- Student requests an available room → active allocation is created.
- Same student requests another room → request is rejected.
- Warden releases allocation → room becomes available again.

### Maintenance
- Student submits a valid request → request appears.
- Empty title/description → validation prevents submission.
- Student sees only their requests.
- Warden changes status → status updates.

### Security
- Open a protected API without a token → 401.
- Student calls a warden-only endpoint → 403.
- Service-role key does not appear in frontend source.

### Responsive UI
- Test desktop, tablet, and mobile widths.
- Check that tables can scroll horizontally on small screens.

## 16. Troubleshooting

### `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required`
Make sure `backend/.env` exists and contains both values. Restart `npm start`.

### `Invalid or expired session`
Login again. The demo JWT expires after 8 hours.

### Database errors
Confirm that `database/schema.sql` was executed in the correct Supabase project and that all four tables exist.

### Port already in use
Change:
```env
PORT=3001
```
Then open http://localhost:3001.

### `npm` is not recognized
Install Node.js LTS and restart VS Code.

## 17. GitHub upload

From the root project directory:

```bash
git init
git status
git add .
git status
git commit -m "Build project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your GitHub repository.

Before pushing:
- Confirm `backend/.env` is ignored.
- Confirm `node_modules/` is ignored.
- Confirm `.env.example` is included.
- Search the project for secret keys.
- Never commit database passwords or private credentials.

If a real secret was already committed, simply adding it to `.gitignore` is not enough. Rotate the exposed credential and remove it from repository history.

## 18. Limitations and future improvements

This MVP intentionally keeps the project manageable for first-year B.Tech students. Future versions could add:
- Admin approval for warden accounts.
- Student profile and hostel-year details.
- Room-wise occupancy visualization.
- Maintenance assignment to specific staff.
- Email/SMS notifications.
- Hostel blocks and floor filters.
- Reports and downloadable summaries.
- Supabase Auth instead of the simple application-level login used here.
- Automated API tests.

## 19. Demo data

The SQL file inserts six demo rooms. You can remove these rows from Supabase later or add more rooms through the Warden dashboard.

## 20. Project conclusion

HostelHub demonstrates how HTML, CSS, JavaScript, Node.js, Express.js, and PostgreSQL can work together to solve a real college-hostel problem. It is intentionally designed with a small number of practical features so first-year students can understand, demonstrate, and extend it.

# Focus Gradebook

A deploy-ready gradebook app for professors/students.

## Features
- Professor + student role-based access
- Professor-created student/professor accounts with temporary password
- Forced password reset on first login
- Professor-owned course isolation
- Assignments with title, description, points, optional extra points, required due date/time
- One submission per student per assignment
- Submission window enforcement with per-student extension support
- Extension penalty percentage applied to final grade
- Student upload + professor graded-file upload
- Protected file access controls

## Tech Stack
- Node.js, Express, TypeScript
- Prisma ORM + PostgreSQL
- EJS views + CSS
- express-session + PostgreSQL session store
- multer file uploads

## Deploy on Render (Blueprint)

### 1) Push this project to GitHub
Render deploys from Git repo.

### 2) Create Blueprint on Render
- Render Dashboard → **New** → **Blueprint**
- Select your repo
- Render reads `render.yaml` and creates:
  - `focus-gradebook` web service
  - `focus-gradebook-db` postgres database

### 3) Set required environment variables
In the Render web service, set:
- `SEED_ADMIN_EMAIL` (your professor login email)
- `SEED_ADMIN_PASSWORD` (initial password)

Everything else is pre-configured in `render.yaml`.

Also verify a persistent disk is mounted for uploads (`focus-gradebook-uploads`) and `UPLOAD_DIR` is set to that mount path.

### 4) Deploy
Build runs:
- `npm ci && npm run build`

Start runs:
- `npm run start:render`
  - applies `prisma migrate deploy`
  - starts app server

### 5) First login
- Login with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- (Recommended) Change that password immediately.

## Local Dev
1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` to local Postgres
3. Run:
   - `npm ci`
   - `npx prisma migrate deploy`
   - `npm run dev`

## Upload Storage Notes
Current MVP stores uploaded files on disk via configurable `UPLOAD_DIR`.
- In Render, this should point to the mounted persistent disk path.
- If not mounted, uploaded files can disappear on restart/redeploy.
- Future upgrade path: S3-compatible storage (Cloudflare R2 / Supabase Storage / AWS S3).

## Security Notes
- Set a strong `SESSION_SECRET`
- Use HTTPS (Render handles TLS)
- Keep file size limits conservative
- Consider MIME allow-list hardening for stricter upload policy

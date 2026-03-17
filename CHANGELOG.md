# Changelog

All notable changes to **Focus Gradebook** will be documented in this file.

## [Unreleased]

### Added
- Initialized project root: `D:\code-puppy workspace\Focus-Gradebook`
- Added `PLAN.md` with phased implementation roadmap
- Added `CHANGELOG.md` for ongoing project tracking

### Added
- Confirmed auth flow: professor-created student accounts + temporary password + forced first-login reset
- Confirmed multi-professor model with strict data isolation by creator
- Confirmed assignment due date/time requirement
- Confirmed one submission per student per assignment
- Confirmed extension model (new due date + penalty percent)
- Confirmed student-first, simple/professional UI direction
- Confirmed broad file upload support (docs/images/videos)

### Changed
- Upgraded plan from proposal to confirmed implementation decisions

### Added
- Scaffolded full TypeScript project with Express, EJS, Prisma, sessions, multer uploads
- Added Prisma schema for: User, Course, CourseEnrollment, Assignment, AssignmentExtension, Submission, Grade
- Added role-based auth middleware and password-reset-on-first-login flow
- Added bootstrap seed behavior for first professor account via env vars
- Added professor features:
  - create student accounts with temporary password
  - create professor accounts with temporary password
  - create/manage own courses and assignments
  - enroll students in courses
  - grant/update per-student assignment extensions with penalty
  - grade submissions and upload graded files
- Added student features:
  - dashboard of enrolled courses and assignments
  - one-time assignment submission upload (enforced)
  - due date and extension-aware submission window checks
  - grade + graded-file visibility
- Added protected file access route to prevent unauthorized download access
- Added baseline styling for a simple, professional UI

### Changed
- Updated runtime to Prisma 7 adapter-based initialization (`@prisma/adapter-pg`)
- Updated `.env` template for local development defaults
- Updated package scripts for dev/build/start and Prisma workflows

### Fixed
- Resolved TypeScript build issues around strict route param typing and Prisma filters
- Confirmed `npm run build` passes successfully

### Added
- Added `render.yaml` Blueprint definition for Render web service + Postgres database
- Added `.env.example` for portable environment setup
- Added `README.md` with Render deployment and operations instructions
- Added Prisma SQL migration artifact at `prisma/migrations/0001_init/migration.sql`
- Added Prisma migration lock file `prisma/migrations/migration_lock.toml`
- Added deploy-safe script `start:render` to run migrations before app startup

### Changed
- Updated build script to run `prisma generate` before `tsc`
- Updated deployment flow to use `prisma migrate deploy` in production startup

### Verified
- `npm run build` passes after deployment wiring changes

### Fixed
- Patched production Prisma import strategy to use stable `@prisma/client` runtime path
- Replaced custom generated-client imports (`src/generated/prisma`) that could fail after TypeScript compile in Render runtime
- Simplified DB client initialization to standard `new PrismaClient()` for compatibility with Render startup

### Verified
- `npx prisma generate` passes with client output in `node_modules/@prisma/client`
- `npm run build` passes after Prisma import/runtime hotfix

### Notes
- Repository push + Blueprint init completed; redeploy required to apply hotfix commit.

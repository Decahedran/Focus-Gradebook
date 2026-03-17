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

### Fixed
- Patched Render build command to install dev dependencies during build (`npm ci --include=dev`) so TypeScript type packages are available
- Resolves compile-time failures for missing `@types/*` modules on Render

### Fixed
- Moved TypeScript compiler/tooling and required `@types/*` packages into `dependencies` to support Render builds that run plain `npm ci` in production mode
- Eliminates compile failures for missing type declarations during `tsc` on Render

### Verified
- `npm install && npm run build` passes after dependency scope fix

### Fixed
- Resolved runtime crash on Render by restoring Prisma 7 adapter-based client initialization
- Updated DB client construction to `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- Fix addresses startup error: `PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`

### Verified
- `npm run build` passes after Prisma adapter initialization fix

### Fixed
- Resolved production login/session persistence issue behind Render proxy
- Enabled Express proxy trust in production (`app.set('trust proxy', 1)`)
- Enabled session proxy awareness (`proxy: true` in session config for production)
- Fix ensures secure session cookies are properly set when TLS terminates at Render

### Verified
- `npm run build` passes after session/proxy configuration fix

### Added
- Added professor route to delete owned courses (`POST /professor/courses/:courseId/delete`)
- Added professor route to delete student accounts (`POST /professor/students/:studentId/delete`)
- Added delete actions/buttons in professor dashboard and course view with confirmation prompts

### Fixed
- Improved upload file viewing reliability:
  - Added explicit missing-file handling in `/uploads/:filename`
  - Added `sendFile` callback error handling with friendly fallback message
- Improved professor submission table layout:
  - Added horizontal table wrapper for overflow
  - Increased minimum width for grade column/form controls to prevent squishing

### Added
- Implemented multi-file student submission support (up to 10 files per assignment submission)
- Added new `SubmissionAttachment` model/table for normalized attachment storage
- Added migration `0002_submission_attachments` with backfill of existing legacy submission files
- Updated student dashboard to upload/select multiple files and display all submitted attachments
- Updated professor assignment view to show all submitted files per student submission
- Updated protected file route to authorize file access for attachment records too

### Fixed
- Added configurable upload storage path via `UPLOAD_DIR`
- Added shared storage config module to ensure upload directory exists at startup
- Updated file serving route to read from configured upload directory
- Added Render persistent disk mount configuration for uploads (`focus-gradebook-uploads`)

### Fixed
- Added legacy upload path fallback when serving files (`UPLOAD_DIR` first, then `./uploads`) to recover files from older path conventions after deployment changes

### Changed
- Switched `/uploads/:filename` behavior from inline open to forced file download
- Download now preserves original file names when available (submission attachments and graded files)

### Notes
- Existing files uploaded before persistent disk setup may still be unavailable (404) if physically lost from ephemeral storage.
- Redeploy latest commit to apply download behavior.

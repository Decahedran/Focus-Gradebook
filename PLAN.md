# Focus Gradebook — Running Plan

_Last updated: 2026-03-17_

## 1) Goal
Build a deployable Gradebook web app (Render-ready) with:
- Professor accounts
- Student accounts
- Course management
- Assignment management per course
- Course roster assignment (students to courses)
- Submission uploads (student)
- Grading + graded file uploads (professor)
- Student grade + graded file visibility

## 2) Chosen Stack (confirmed)
- **Backend**: Node.js + Express + TypeScript
- **DB**: PostgreSQL + Prisma ORM
- **Auth**: Session-based auth + RBAC
- **Storage**: Local disk for MVP (`uploads/`) to stay free/simple on Render-compatible deploys
- **Frontend**: Server-rendered EJS + clean, student-first UI (simple + professional)
- **Deploy**: Render Web Service + Render Postgres

## 3) Scope Breakdown
### Phase 0 — Foundation
- [x] Project scaffold
- [x] Env config and secrets handling
- [x] PLAN + CHANGELOG living docs

### Phase 1 — Auth + Roles
- [x] Bootstrap initial professor account
- [x] Professor login
- [x] Professor can create other professor accounts
- [x] Professor can create student accounts with temporary passwords
- [x] Student forced to change password on first login
- [x] RBAC middleware and protected routes

### Phase 2 — Academic Core
- [x] Course CRUD (create + view + delete; strictly professor-owned)
- [x] Student management (create + delete)
- [x] Assign students to courses
- [x] Assignment CRUD (create + view) with fields:
  - title (required)
  - description (required)
  - pointsValue (required)
  - extraPointsPossible (optional)
  - dueAt (required date+time)

### Phase 3 — Submission + Grading
- [x] Student assignment submission upload (one submission per assignment, multiple attachments)
- [x] Submission window enforcement (cannot submit after deadline)
- [x] Professor can add assignment extension with:
  - extendedDueAt (new date+time)
  - extensionPenaltyPercent (grade reduction)
- [x] Extension-aware submission logic (submission re-opened until extension deadline)
- [x] Professor grading workflow
- [x] Professor graded-file upload
- [x] Student view grade + graded file

### Phase 4 — UX + Deployment
- [x] Basic dashboard UIs (prof/student)
- [x] Error handling + validation
- [x] Seed/bootstrap strategy (env-based default professor)
- [x] Render deploy config + docs

## 4) Data Model Draft
- User(id, email, passwordHash, role[PROFESSOR|STUDENT], mustChangePassword, createdAt)
- Course(id, name, code, professorId)
- CourseEnrollment(id, courseId, studentId)
- Assignment(id, courseId, title, description, pointsValue, extraPointsPossible?, dueAt)
- AssignmentExtension(id, assignmentId, studentId, extendedDueAt, extensionPenaltyPercent, createdByProfessorId)
- Submission(id, assignmentId, studentId, submittedFilePath, submittedAt)
- Grade(id, submissionId, pointsEarnedRaw, pointsEarnedFinal, feedback?, gradedFilePath?, gradedAt, gradedByProfessorId)

## 5) Key Design Principles
- DRY: shared validation and auth guards
- YAGNI: no over-engineering (single professor tenant first unless required)
- SOLID: clear service/repository boundaries
- Zen of Python vibes: explicit > implicit, simple > complex

## 6) Confirmed Product Decisions
1. Student accounts are created by professor with temporary passwords.
2. Student must reset password on first login.
3. Multiple professors are supported; each professor only manages courses they create.
4. Single submission per student per assignment.
5. Assignment due date/time is required.
6. After due date, submission is blocked unless professor grants extension.
7. Extension includes new due date/time + grade reduction rule.
8. Accept a variety of file types (including images/videos) for uploads.
9. UI should be intuitive, simple, and professional, with student-friendly navigation.

## 7) Current Status
- ✅ Workspace located
- ✅ Project root created
- ✅ Plan initialized
- ✅ Requirements clarified
- ✅ Full MVP scaffold implemented (auth, courses, assignments, submissions, grading, extensions)
- ✅ TypeScript build passing
- ✅ Render deployment wiring completed (`render.yaml`, migration files, deploy scripts, README)
- ✅ Repository pushed to GitHub and Blueprint started
- ✅ Hotfix applied for production-safe Prisma client imports (`@prisma/client`)
- ✅ Identified Render build failure root cause (devDependencies omitted during production npm ci)
- ✅ Applied resilience fix by moving TS build-time packages to `dependencies`
- ✅ Local build validated after dependency scope change
- ✅ Fixed Prisma runtime initialization crash on Render (adapter-based client options)
- ✅ Fixed production session/cookie behavior for Render proxy setup
- ✅ Added professor ability to delete courses and delete student accounts
- ✅ Added multi-file student submission support (up to 10 attachments per submission)
- ✅ Added attachment-aware file access checks and display in professor/student dashboards
- ✅ Added configurable persistent upload directory (`UPLOAD_DIR`) + Render disk mount config
- ✅ Added legacy upload-path fallback for file retrieval compatibility
- ✅ Updated attachment/file access endpoint to force downloads instead of inline open
- ✅ Added assignment detail visibility (description + points settings) on submissions/grade page
- ⏳ Next: redeploy latest commit and verify updated assignment details UI

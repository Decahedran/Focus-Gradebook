import express from "express";
import session from "express-session";
import path from "path";
import fs from "fs";
import PgSession from "connect-pg-simple";
import pg from "pg";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { hashPassword } from "./utils/auth";
import { authRouter } from "./routes/auth";
import { professorRouter } from "./routes/professor";
import { studentRouter } from "./routes/student";
import { requireAuth, requirePasswordResetHandled } from "./middleware/auth";

const PostgresStore = PgSession(session);
const pgPool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use(
  session({
    proxy: env.NODE_ENV === "production",
    store: new PostgresStore({
      pool: pgPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  next();
});

app.get("/", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }
  if (req.session.user.mustChangePassword) {
    res.redirect("/change-password");
    return;
  }
  if (req.session.user.role === "PROFESSOR") {
    res.redirect("/professor/dashboard");
    return;
  }
  res.redirect("/student/dashboard");
});

app.use(authRouter);
app.use(requireAuth, requirePasswordResetHandled);
app.use("/professor", professorRouter);
app.use("/student", studentRouter);

app.get("/uploads/:filename", requireAuth, async (req, res) => {
  const filename = String(req.params.filename);
  const user = req.session.user!;

  const submission = await prisma.submission.findFirst({
    where: {
      OR: [
        { storedFileName: filename },
        { attachments: { some: { storedFileName: filename } } },
        { grade: { is: { gradedStoredFileName: filename } } },
      ],
    },
    include: {
      assignment: { include: { course: true } },
      grade: true,
    },
  });

  if (!submission) {
    res.status(404).render("error", { message: "File not found." });
    return;
  }

  if (user.role === "PROFESSOR") {
    if (submission.assignment.course.professorId !== user.id) {
      res.status(403).render("error", { message: "No access to this file." });
      return;
    }
  } else if (submission.studentId !== user.id) {
    res.status(403).render("error", { message: "No access to this file." });
    return;
  }

  const absolutePath = path.join(process.cwd(), "uploads", filename);
  if (!fs.existsSync(absolutePath)) {
    res.status(404).render("error", { message: "File record exists, but file is missing from storage." });
    return;
  }

  res.sendFile(absolutePath, (error) => {
    if (error) {
      console.error("sendFile error", error);
      if (!res.headersSent) {
        res.status(500).render("error", { message: "Could not open this file right now." });
      }
    }
  });
});

app.use((_req, res) => {
  res.status(404).render("error", { message: "Page not found." });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).render("error", { message: "Something went wrong." });
});

export async function ensureBootstrapProfessor(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL } });
  if (existing) return;

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "PROFESSOR",
      mustChangePassword: false,
    },
  });

  console.log(`Seeded default professor: ${env.SEED_ADMIN_EMAIL}`);
}

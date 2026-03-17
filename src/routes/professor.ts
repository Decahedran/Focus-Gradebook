import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireRole } from "../middleware/auth";
import { hashPassword } from "../utils/auth";
import { upload } from "../config/upload";
import { applyExtensionPenalty } from "../services/submissionPolicy";

export const professorRouter = Router();

professorRouter.use(requireRole("PROFESSOR"));

professorRouter.get("/dashboard", async (req, res) => {
  const professorId = req.session.user!.id;
  const [courses, students, professors] = await Promise.all([
    prisma.course.findMany({ where: { professorId }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { email: "asc" } }),
    prisma.user.findMany({ where: { role: "PROFESSOR" }, orderBy: { email: "asc" } }),
  ]);

  res.render("professor/dashboard", { courses, students, professors, error: null });
});

professorRouter.post("/students", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    temporaryPassword: z.string().min(8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid student form values." });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).render("error", { message: "User with that email already exists." });
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.temporaryPassword),
      role: "STUDENT",
      mustChangePassword: true,
    },
  });

  res.redirect("/professor/dashboard");
});

professorRouter.post("/professors", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    temporaryPassword: z.string().min(8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid professor form values." });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).render("error", { message: "User with that email already exists." });
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.temporaryPassword),
      role: "PROFESSOR",
      mustChangePassword: true,
    },
  });

  res.redirect("/professor/dashboard");
});

professorRouter.post("/courses", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    code: z.string().min(2),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid course values." });
    return;
  }

  await prisma.course.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      professorId: req.session.user!.id,
    },
  });

  res.redirect("/professor/dashboard");
});

professorRouter.post("/courses/:courseId/delete", async (req, res) => {
  const courseId = String(req.params.courseId);
  const professorId = req.session.user!.id;

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId },
  });

  if (!course) {
    res.status(404).render("error", { message: "Course not found or not owned by you." });
    return;
  }

  await prisma.course.delete({ where: { id: course.id } });
  res.redirect("/professor/dashboard");
});

professorRouter.post("/students/:studentId/delete", async (req, res) => {
  const studentId = String(req.params.studentId);

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") {
    res.status(404).render("error", { message: "Student not found." });
    return;
  }

  await prisma.user.delete({ where: { id: student.id } });
  res.redirect("/professor/dashboard");
});

professorRouter.get("/courses/:courseId", async (req, res) => {
  const courseId = req.params.courseId;
  const professorId = req.session.user!.id;

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId },
    include: {
      assignments: { orderBy: { dueAt: "asc" } },
      enrollments: { include: { student: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!course) {
    res.status(404).render("error", { message: "Course not found." });
    return;
  }

  const allStudents = await prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { email: "asc" } });

  res.render("professor/course", { course, allStudents });
});

professorRouter.post("/courses/:courseId/enrollments", async (req, res) => {
  const schema = z.object({ studentId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid enrollment values." });
    return;
  }

  const course = await prisma.course.findFirst({
    where: { id: req.params.courseId, professorId: req.session.user!.id },
  });

  if (!course) {
    res.status(404).render("error", { message: "Course not found." });
    return;
  }

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: parsed.data.studentId,
      },
    },
    create: {
      courseId: course.id,
      studentId: parsed.data.studentId,
    },
    update: {},
  });

  res.redirect(`/professor/courses/${course.id}`);
});

professorRouter.post("/courses/:courseId/assignments", async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    description: z.string().min(2),
    pointsValue: z.coerce.number().int().min(1),
    extraPointsPossible: z.coerce.number().int().min(0).optional(),
    dueAt: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid assignment values." });
    return;
  }

  const course = await prisma.course.findFirst({
    where: { id: req.params.courseId, professorId: req.session.user!.id },
  });

  if (!course) {
    res.status(404).render("error", { message: "Course not found." });
    return;
  }

  const dueAt = new Date(parsed.data.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    res.status(400).render("error", { message: "Invalid due date." });
    return;
  }

  await prisma.assignment.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      description: parsed.data.description,
      pointsValue: parsed.data.pointsValue,
      extraPointsPossible: parsed.data.extraPointsPossible,
      dueAt,
    },
  });

  res.redirect(`/professor/courses/${course.id}`);
});

professorRouter.get("/assignments/:assignmentId", async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const professorId = req.session.user!.id;

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, course: { professorId } },
    include: {
      course: true,
      submissions: {
        include: {
          student: true,
          grade: true,
          attachments: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) {
    res.status(404).render("error", { message: "Assignment not found." });
    return;
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: assignment.courseId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const extensions = await prisma.assignmentExtension.findMany({
    where: { assignmentId: assignment.id },
  });

  res.render("professor/assignment", { assignment, enrollments, extensions });
});

professorRouter.post("/assignments/:assignmentId/extensions", async (req, res) => {
  const schema = z.object({
    studentId: z.string().min(1),
    extendedDueAt: z.string().min(1),
    extensionPenaltyPercent: z.coerce.number().int().min(0).max(100),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid extension values." });
    return;
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: req.params.assignmentId, course: { professorId: req.session.user!.id } },
  });

  if (!assignment) {
    res.status(404).render("error", { message: "Assignment not found." });
    return;
  }

  const extendedDueAt = new Date(parsed.data.extendedDueAt);
  if (Number.isNaN(extendedDueAt.getTime()) || extendedDueAt <= assignment.dueAt) {
    res.status(400).render("error", { message: "Extension due date must be later than assignment due date." });
    return;
  }

  await prisma.assignmentExtension.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: parsed.data.studentId,
      },
    },
    create: {
      assignmentId: assignment.id,
      studentId: parsed.data.studentId,
      extendedDueAt,
      extensionPenaltyPercent: parsed.data.extensionPenaltyPercent,
      createdByProfessorId: req.session.user!.id,
    },
    update: {
      extendedDueAt,
      extensionPenaltyPercent: parsed.data.extensionPenaltyPercent,
      createdByProfessorId: req.session.user!.id,
    },
  });

  res.redirect(`/professor/assignments/${assignment.id}`);
});

professorRouter.post("/submissions/:submissionId/grade", upload.single("gradedFile"), async (req, res) => {
  const schema = z.object({
    pointsEarnedRaw: z.coerce.number().min(0),
    feedback: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("error", { message: "Invalid grade values." });
    return;
  }

  const submissionId = String(req.params.submissionId);

  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      assignment: {
        course: {
          professorId: req.session.user!.id,
        },
      },
    },
    include: {
      assignment: true,
    },
  });

  if (!submission) {
    res.status(404).render("error", { message: "Submission not found." });
    return;
  }

  const extension = await prisma.assignmentExtension.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
      },
    },
  });

  const penalty = extension?.extensionPenaltyPercent ?? 0;
  const pointsEarnedFinal = applyExtensionPenalty(parsed.data.pointsEarnedRaw, penalty);

  await prisma.grade.upsert({
    where: { submissionId: submission.id },
    create: {
      submissionId: submission.id,
      pointsEarnedRaw: parsed.data.pointsEarnedRaw,
      pointsEarnedFinal,
      feedback: parsed.data.feedback || null,
      gradedOriginalName: req.file?.originalname,
      gradedStoredFileName: req.file?.filename,
      gradedMimeType: req.file?.mimetype,
      gradedByProfessorId: req.session.user!.id,
    },
    update: {
      pointsEarnedRaw: parsed.data.pointsEarnedRaw,
      pointsEarnedFinal,
      feedback: parsed.data.feedback || null,
      gradedOriginalName: req.file?.originalname,
      gradedStoredFileName: req.file?.filename,
      gradedMimeType: req.file?.mimetype,
      gradedByProfessorId: req.session.user!.id,
      gradedAt: new Date(),
    },
  });

  res.redirect(`/professor/assignments/${submission.assignmentId}`);
});

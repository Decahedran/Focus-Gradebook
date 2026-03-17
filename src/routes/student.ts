import { Router } from "express";
import { prisma } from "../db/prisma";
import { requireRole } from "../middleware/auth";
import { upload } from "../config/upload";
import { getEffectiveDueDate, isSubmissionOpen } from "../services/submissionPolicy";

export const studentRouter = Router();

studentRouter.use(requireRole("STUDENT"));

studentRouter.get("/dashboard", async (req, res) => {
  const studentId = req.session.user!.id;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          assignments: {
            include: {
              submissions: {
                where: { studentId },
                include: { grade: true },
              },
            },
            orderBy: { dueAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const extensionRows = await prisma.assignmentExtension.findMany({
    where: { studentId },
  });

  const extensionMap = new Map(extensionRows.map((ext) => [ext.assignmentId, ext]));

  const courses = enrollments.map((enrollment) => {
    const assignments = enrollment.course.assignments.map((assignment) => {
      const extension = extensionMap.get(assignment.id);
      const effectiveDueAt = getEffectiveDueDate(assignment, extension);
      const canSubmit = isSubmissionOpen(assignment, extension);
      return {
        ...assignment,
        extension,
        effectiveDueAt,
        canSubmit,
      };
    });
    return {
      ...enrollment.course,
      assignments,
    };
  });

  res.render("student/dashboard", { courses });
});

studentRouter.post("/assignments/:assignmentId/submit", upload.single("submissionFile"), async (req, res) => {
  const studentId = req.session.user!.id;
  const assignmentId = String(req.params.assignmentId);

  if (!req.file) {
    res.status(400).render("error", { message: "Submission file is required." });
    return;
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        enrollments: {
          some: {
            studentId,
          },
        },
      },
    },
  });

  if (!assignment) {
    res.status(404).render("error", { message: "Assignment not found." });
    return;
  }

  const existing = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
  });

  if (existing) {
    res.status(400).render("error", { message: "You already submitted this assignment." });
    return;
  }

  const extension = await prisma.assignmentExtension.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
  });

  if (!isSubmissionOpen(assignment, extension)) {
    res.status(400).render("error", { message: "Submission window is closed." });
    return;
  }

  await prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      mimeType: req.file.mimetype,
    },
  });

  res.redirect("/student/dashboard");
});

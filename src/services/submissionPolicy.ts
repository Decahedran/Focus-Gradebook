import { Assignment, AssignmentExtension } from "../generated/prisma/client";

export function getEffectiveDueDate(assignment: Assignment, extension?: AssignmentExtension | null): Date {
  if (extension && extension.extendedDueAt > assignment.dueAt) {
    return extension.extendedDueAt;
  }
  return assignment.dueAt;
}

export function isSubmissionOpen(assignment: Assignment, extension?: AssignmentExtension | null): boolean {
  const effectiveDueDate = getEffectiveDueDate(assignment, extension);
  return Date.now() <= effectiveDueDate.getTime();
}

export function applyExtensionPenalty(rawPoints: number, penaltyPercent: number): number {
  if (penaltyPercent <= 0) return rawPoints;
  const final = rawPoints * (1 - penaltyPercent / 100);
  return Math.max(0, Number(final.toFixed(2)));
}

-- CreateTable
CREATE TABLE "SubmissionAttachment" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "storedFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttachment_storedFileName_key" ON "SubmissionAttachment"("storedFileName");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_submissionId_idx" ON "SubmissionAttachment"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionAttachment"
  ADD CONSTRAINT "SubmissionAttachment_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing single-file submissions into attachment rows
INSERT INTO "SubmissionAttachment" ("id", "submissionId", "originalFileName", "storedFileName", "mimeType", "createdAt")
SELECT
  CONCAT('legacy-', "id"),
  "id",
  "originalFileName",
  "storedFileName",
  "mimeType",
  "submittedAt"
FROM "Submission"
WHERE "storedFileName" IS NOT NULL AND "originalFileName" IS NOT NULL;

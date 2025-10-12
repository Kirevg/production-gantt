/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `parentTaskId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `workTypeId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `TaskLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_parentTaskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_workTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskLink" DROP CONSTRAINT "TaskLink_sourceTaskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskLink" DROP CONSTRAINT "TaskLink_targetTaskId_fkey";

-- DropIndex
DROP INDEX "public"."Task_assigneeId_idx";

-- DropIndex
DROP INDEX "public"."Task_parentTaskId_idx";

-- DropIndex
DROP INDEX "public"."Task_startDate_endDate_idx";

-- DropIndex
DROP INDEX "public"."Task_workTypeId_idx";

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "assigneeId",
DROP COLUMN "endDate",
DROP COLUMN "parentTaskId",
DROP COLUMN "progress",
DROP COLUMN "startDate",
DROP COLUMN "workTypeId",
ADD COLUMN     "productSum" DOUBLE PRECISION;

-- DropTable
DROP TABLE "public"."TaskLink";

-- DropEnum
DROP TYPE "public"."LinkType";

-- CreateTable
CREATE TABLE "public"."WorkStage" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workTypeId" TEXT,
    "assigneeId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sum" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkStage_taskId_idx" ON "public"."WorkStage"("taskId");

-- CreateIndex
CREATE INDEX "WorkStage_workTypeId_idx" ON "public"."WorkStage"("workTypeId");

-- CreateIndex
CREATE INDEX "WorkStage_assigneeId_idx" ON "public"."WorkStage"("assigneeId");

-- CreateIndex
CREATE INDEX "WorkStage_startDate_endDate_idx" ON "public"."WorkStage"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Task_orderIndex_idx" ON "public"."Task"("orderIndex");

-- AddForeignKey
ALTER TABLE "public"."WorkStage" ADD CONSTRAINT "WorkStage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkStage" ADD CONSTRAINT "WorkStage_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "public"."WorkType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkStage" ADD CONSTRAINT "WorkStage_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'LIVE_ALBUM');

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "label" TEXT,
    "coverImage" TEXT,
    "sourceUrl" TEXT,
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressRelease" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "receivedFrom" TEXT,
    "receivedAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "subtitle" TEXT,
    "date" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQA" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "InterviewQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "rubricVersion" INTEGER NOT NULL DEFAULT 1,
    "take" TEXT NOT NULL,
    "biasLine" TEXT NOT NULL DEFAULT '',
    "craftLine" TEXT NOT NULL DEFAULT '',
    "nerveLine" TEXT NOT NULL DEFAULT '',
    "crowdLine" TEXT NOT NULL DEFAULT '',
    "replayLine" TEXT NOT NULL DEFAULT '',
    "bias" INTEGER,
    "craft" INTEGER,
    "nerve" INTEGER,
    "crowd" INTEGER,
    "replay" INTEGER,
    "total" INTEGER,
    "isFan" BOOLEAN NOT NULL DEFAULT false,
    "listenedAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opinion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "detail" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "contentType" TEXT,
    "contentId" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT,
    "sessionHash" TEXT NOT NULL,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_slug_key" ON "Release"("slug");

-- CreateIndex
CREATE INDEX "Release_artist_idx" ON "Release"("artist");

-- CreateIndex
CREATE UNIQUE INDEX "PressRelease_slug_key" ON "PressRelease"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PressRelease_releaseId_key" ON "PressRelease"("releaseId");

-- CreateIndex
CREATE INDEX "PressRelease_status_publishedAt_idx" ON "PressRelease"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_slug_key" ON "Interview"("slug");

-- CreateIndex
CREATE INDEX "Interview_status_publishedAt_idx" ON "Interview"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewQA_interviewId_position_key" ON "InterviewQA"("interviewId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Review_slug_key" ON "Review"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Review_releaseId_key" ON "Review"("releaseId");

-- CreateIndex
CREATE INDEX "Review_status_publishedAt_idx" ON "Review"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Review_rubricVersion_total_idx" ON "Review"("rubricVersion", "total");

-- CreateIndex
CREATE UNIQUE INDEX "Opinion_slug_key" ON "Opinion"("slug");

-- CreateIndex
CREATE INDEX "Opinion_status_publishedAt_idx" ON "Opinion"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- CreateIndex
CREATE INDEX "PageView_at_idx" ON "PageView"("at");

-- CreateIndex
CREATE INDEX "PageView_path_at_idx" ON "PageView"("path", "at");

-- AddForeignKey
ALTER TABLE "PressRelease" ADD CONSTRAINT "PressRelease_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQA" ADD CONSTRAINT "InterviewQA_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Score ranges from the rubric. The total is computed in code and must match.
ALTER TABLE "Review" ADD CONSTRAINT "Review_bias_range"   CHECK ("bias"   IS NULL OR "bias"   BETWEEN 0 AND 25);
ALTER TABLE "Review" ADD CONSTRAINT "Review_craft_range"  CHECK ("craft"  IS NULL OR "craft"  BETWEEN 0 AND 30);
ALTER TABLE "Review" ADD CONSTRAINT "Review_nerve_range"  CHECK ("nerve"  IS NULL OR "nerve"  BETWEEN 0 AND 15);
ALTER TABLE "Review" ADD CONSTRAINT "Review_crowd_range"  CHECK ("crowd"  IS NULL OR "crowd"  BETWEEN 0 AND 15);
ALTER TABLE "Review" ADD CONSTRAINT "Review_replay_range" CHECK ("replay" IS NULL OR "replay" BETWEEN 0 AND 15);
ALTER TABLE "Review" ADD CONSTRAINT "Review_total_matches" CHECK (
  "total" IS NULL OR "total" = COALESCE("bias",0)+COALESCE("craft",0)+COALESCE("nerve",0)+COALESCE("crowd",0)+COALESCE("replay",0)
);

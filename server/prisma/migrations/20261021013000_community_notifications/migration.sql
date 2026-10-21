-- CreateEnum
CREATE TYPE "CommunityReactionKind" AS ENUM ('HELPFUL', 'INSIGHT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMUNITY_ANSWER', 'ANSWER_ACCEPTED', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'PROBLEM_COMMENT');

-- CreateTable
CREATE TABLE "CommunityQuestion" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "codeSnippet" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAnswerId" TEXT,

    CONSTRAINT "CommunityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityQuestionReaction" (
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CommunityReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityQuestionReaction_pkey" PRIMARY KEY ("targetId","userId","kind")
);

-- CreateTable
CREATE TABLE "CommunityAnswerReaction" (
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CommunityReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityAnswerReaction_pkey" PRIMARY KEY ("targetId","userId","kind")
);

-- CreateTable
CREATE TABLE "CommunityQuestionView" (
    "questionId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityQuestionView_pkey" PRIMARY KEY ("questionId","viewerKey")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "eventKey" TEXT NOT NULL,
    "problemId" TEXT,
    "questionId" TEXT,
    "answerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityQuestion_acceptedAnswerId_key" ON "CommunityQuestion"("acceptedAnswerId");

-- CreateIndex
CREATE INDEX "CommunityQuestion_createdAt_id_idx" ON "CommunityQuestion"("createdAt", "id");

-- CreateIndex
CREATE INDEX "CommunityQuestion_lastActivityAt_id_idx" ON "CommunityQuestion"("lastActivityAt", "id");

-- CreateIndex
CREATE INDEX "CommunityAnswer_questionId_createdAt_id_idx" ON "CommunityAnswer"("questionId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_id_idx" ON "Notification"("recipientUserId", "readAt", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientUserId_eventKey_key" ON "Notification"("recipientUserId", "eventKey");

-- AddForeignKey
ALTER TABLE "CommunityQuestion" ADD CONSTRAINT "CommunityQuestion_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityQuestion" ADD CONSTRAINT "CommunityQuestion_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "CommunityAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswer" ADD CONSTRAINT "CommunityAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswer" ADD CONSTRAINT "CommunityAnswer_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityQuestionReaction" ADD CONSTRAINT "CommunityQuestionReaction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CommunityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityQuestionReaction" ADD CONSTRAINT "CommunityQuestionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswerReaction" ADD CONSTRAINT "CommunityAnswerReaction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CommunityAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnswerReaction" ADD CONSTRAINT "CommunityAnswerReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityQuestionView" ADD CONSTRAINT "CommunityQuestionView_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "CommunityAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;


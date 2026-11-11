-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "companyDomain" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "dateApplied" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStatusChangeAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEmailAt" DATETIME,
    "companyLinkedInUrl" TEXT,
    "recruiterName" TEXT,
    "recruiterLinkedInUrl" TEXT,
    "recruiterEmail" TEXT,
    "recruiterInfoSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "connectionNotes" TEXT,
    "gmailThreadId" TEXT,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmailMessageId" TEXT NOT NULL,
    "gmailThreadId" TEXT NOT NULL,
    "applicationId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "fromDomain" TEXT NOT NULL,
    "toAddress" TEXT,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "bodyText" TEXT,
    "internalDate" DATETIME NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "classificationSource" TEXT NOT NULL DEFAULT 'RULE',
    "classificationConfidence" REAL,
    "matchedSignals" TEXT,
    "parsedSenderName" TEXT,
    "parsedSenderTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailMessage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredByEmailId" TEXT,
    CONSTRAINT "StatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "lastHistoryId" TEXT,
    "lastSyncAt" DATETIME,
    "lastFullSyncAt" DATETIME,
    "status" TEXT,
    "lastError" TEXT
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "scope" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_gmailThreadId_key" ON "Application"("gmailThreadId");

-- CreateIndex
CREATE INDEX "Application_stage_idx" ON "Application"("stage");

-- CreateIndex
CREATE INDEX "Application_lastStatusChangeAt_idx" ON "Application"("lastStatusChangeAt");

-- CreateIndex
CREATE INDEX "Application_companyDomain_idx" ON "Application"("companyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_gmailMessageId_key" ON "EmailMessage"("gmailMessageId");

-- CreateIndex
CREATE INDEX "EmailMessage_applicationId_idx" ON "EmailMessage"("applicationId");

-- CreateIndex
CREATE INDEX "EmailMessage_gmailThreadId_idx" ON "EmailMessage"("gmailThreadId");

-- CreateIndex
CREATE INDEX "EmailMessage_category_idx" ON "EmailMessage"("category");

-- CreateIndex
CREATE INDEX "StatusEvent_applicationId_idx" ON "StatusEvent"("applicationId");

-- CreateIndex
CREATE INDEX "StatusEvent_occurredAt_idx" ON "StatusEvent"("occurredAt");

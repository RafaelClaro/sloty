-- CreateTable
CREATE TABLE "PatientNote" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientNote_establishmentId_clientPhone_key" ON "PatientNote"("establishmentId", "clientPhone");

-- AddForeignKey
ALTER TABLE "PatientNote" ADD CONSTRAINT "PatientNote_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

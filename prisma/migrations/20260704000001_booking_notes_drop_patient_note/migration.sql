-- AlterTable: add notes to Booking
ALTER TABLE "Booking" ADD COLUMN "notes" TEXT;

-- DropTable: remove PatientNote (replaced by Booking.notes)
DROP TABLE IF EXISTS "PatientNote";

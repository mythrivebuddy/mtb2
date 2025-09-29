-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "notesPrivacy" "public"."NotesPrivacy" NOT NULL DEFAULT 'VISIBLE_TO_GROUP';

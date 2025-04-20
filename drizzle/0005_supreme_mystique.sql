ALTER TABLE "flashcard" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "flashcard" ADD COLUMN "difficulty" integer DEFAULT 0 NOT NULL;
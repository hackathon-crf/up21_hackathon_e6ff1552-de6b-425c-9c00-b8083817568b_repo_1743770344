CREATE TABLE "flashcard_deck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "flashcard" ADD COLUMN "deck_id" uuid;--> statement-breakpoint
ALTER TABLE "flashcard_deck" ADD CONSTRAINT "flashcard_deck_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flashcard_deck_user_id_idx" ON "flashcard_deck" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_deck_id_flashcard_deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."flashcard_deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flashcard_deck_id_idx" ON "flashcard" USING btree ("deck_id");
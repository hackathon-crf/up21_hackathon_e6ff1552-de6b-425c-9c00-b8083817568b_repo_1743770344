ALTER TABLE "chat_session" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_session" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_session" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "chat_session_updated_at_idx" ON "chat_session" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "chat_session_user_position_idx" ON "chat_session" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "chat_session_status_idx" ON "chat_session" USING btree ("status");
ALTER TABLE "flashcard_deck" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "flashcard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_answer" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_lobby" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_player" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_round" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rag_collection" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rag_document" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_stat" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "flashcard_deck" CASCADE;--> statement-breakpoint
DROP TABLE "flashcard" CASCADE;--> statement-breakpoint
DROP TABLE "game_answer" CASCADE;--> statement-breakpoint
DROP TABLE "game_lobby" CASCADE;--> statement-breakpoint
DROP TABLE "game_player" CASCADE;--> statement-breakpoint
DROP TABLE "game_round" CASCADE;--> statement-breakpoint
DROP TABLE "rag_collection" CASCADE;--> statement-breakpoint
DROP TABLE "rag_document" CASCADE;--> statement-breakpoint
DROP TABLE "study_stat" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_message" RENAME COLUMN "session_id" TO "sessionId";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "feedback" RENAME COLUMN "message_id" TO "messageId";--> statement-breakpoint
ALTER TABLE "feedback" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "user_preference" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "user_preference" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_session_id_chat_session_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_session" DROP CONSTRAINT "chat_session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_message_id_chat_message_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preference" DROP CONSTRAINT "user_preference_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "chat_message_session_id_idx";--> statement-breakpoint
DROP INDEX "chat_message_timestamp_idx";--> statement-breakpoint
DROP INDEX "chat_session_user_id_idx";--> statement-breakpoint
DROP INDEX "email_idx";--> statement-breakpoint
ALTER TABLE "user_preference" DROP CONSTRAINT "user_preference_user_id_pk";--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "metrics" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_session" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "prompt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "model" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "context" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "rag" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "other" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_message" ADD COLUMN "sources" jsonb;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sessionId_chat_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_messageId_chat_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
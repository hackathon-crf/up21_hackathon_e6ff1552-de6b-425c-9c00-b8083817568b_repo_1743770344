CREATE TABLE "flashcard_deck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "flashcard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"deck_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"title" varchar(256) DEFAULT '',
	"image_url" varchar(2048) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"next_review" timestamp with time zone,
	"last_review" timestamp with time zone,
	"ai_generated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"answer_text" text,
	"time_taken" integer,
	"is_correct" boolean,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "game_answer_round_player_uq" UNIQUE("round_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "game_lobby" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"host_user_id" varchar(36) NOT NULL,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"flashcard_deck_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "game_lobby_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "game_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"lobby_id" integer NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'joined' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "game_player_lobby_user_uq" UNIQUE("lobby_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "game_round" (
	"id" serial PRIMARY KEY NOT NULL,
	"lobby_id" integer NOT NULL,
	"question_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"end_time" timestamp with time zone,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	CONSTRAINT "game_round_lobby_number_uq" UNIQUE("lobby_id","round_number")
);
--> statement-breakpoint
CREATE TABLE "rag_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "rag_collection_name_uq" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rag_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_stat" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"studied_today" integer DEFAULT 0 NOT NULL,
	"total_studied" integer DEFAULT 0 NOT NULL,
	"correct_today" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_study_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "chat_message" RENAME COLUMN "sessionId" TO "session_id";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "chat_session" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "feedback" RENAME COLUMN "messageId" TO "message_id";--> statement-breakpoint
ALTER TABLE "feedback" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_preference" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_preference" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "chat_message" DROP CONSTRAINT "chat_message_sessionId_chat_session_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_session" DROP CONSTRAINT "chat_session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_messageId_chat_message_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preference" DROP CONSTRAINT "user_preference_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_message" ALTER COLUMN "metrics" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "chat_session" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "prompt" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "model" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "context" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "rag" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preference" ALTER COLUMN "other" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_pk" PRIMARY KEY("user_id");--> statement-breakpoint
ALTER TABLE "flashcard_deck" ADD CONSTRAINT "flashcard_deck_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_deck_id_flashcard_deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."flashcard_deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_round_id_game_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."game_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_player_id_game_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_lobby" ADD CONSTRAINT "game_lobby_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_lobby" ADD CONSTRAINT "game_lobby_flashcard_deck_id_flashcard_deck_id_fk" FOREIGN KEY ("flashcard_deck_id") REFERENCES "public"."flashcard_deck"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_lobby_id_game_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."game_lobby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_round" ADD CONSTRAINT "game_round_lobby_id_game_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."game_lobby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_round" ADD CONSTRAINT "game_round_question_id_flashcard_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."flashcard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_document" ADD CONSTRAINT "rag_document_collection_id_rag_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."rag_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_stat" ADD CONSTRAINT "study_stat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flashcard_deck_user_id_idx" ON "flashcard_deck" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_user_id_idx" ON "flashcard" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_deck_id_idx" ON "flashcard" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_next_review_idx" ON "flashcard" USING btree ("next_review");--> statement-breakpoint
CREATE INDEX "game_answer_round_id_idx" ON "game_answer" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "game_answer_player_id_idx" ON "game_answer" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "game_lobby_code_idx" ON "game_lobby" USING btree ("code");--> statement-breakpoint
CREATE INDEX "game_lobby_host_idx" ON "game_lobby" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "game_lobby_deck_id_idx" ON "game_lobby" USING btree ("flashcard_deck_id");--> statement-breakpoint
CREATE INDEX "game_player_lobby_id_idx" ON "game_player" USING btree ("lobby_id");--> statement-breakpoint
CREATE INDEX "game_player_user_id_idx" ON "game_player" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_round_lobby_id_idx" ON "game_round" USING btree ("lobby_id");--> statement-breakpoint
CREATE INDEX "game_round_question_id_idx" ON "game_round" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "rag_document_collection_id_idx" ON "rag_document" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "study_stat_user_id_idx" ON "study_stat" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_message_id_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_session_id_idx" ON "chat_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_message_timestamp_idx" ON "chat_message" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "chat_session_user_id_idx" ON "chat_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_message_id_idx" ON "feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "chat_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"title" varchar(256) DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"title" varchar(256) DEFAULT '',
	"image_url" varchar(2048) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"repetitions" integer DEFAULT 0,
	"ease_factor" real DEFAULT 2.5,
	"interval" integer DEFAULT 1,
	"next_review" timestamp with time zone,
	"last_review" timestamp with time zone,
	"ai_generated" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "game_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"answer_text" text NOT NULL,
	"time_taken" integer NOT NULL,
	"is_correct" boolean DEFAULT false,
	"points_awarded" integer DEFAULT 0,
	"submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "game_answer_round_id_player_id_unique" UNIQUE("round_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "game_lobby" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"host_user_id" varchar(36) NOT NULL,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"flashcard_set_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "game_lobby_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "game_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"lobby_id" integer NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"score" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'joined' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "game_player_lobby_id_user_id_unique" UNIQUE("lobby_id","user_id")
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
	CONSTRAINT "game_round_lobby_id_round_number_unique" UNIQUE("lobby_id","round_number")
);
--> statement-breakpoint
CREATE TABLE "rag_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "rag_collection_name_unique" UNIQUE("name")
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
	"studied_today" integer DEFAULT 0,
	"total_studied" integer DEFAULT 0,
	"correct_today" integer DEFAULT 0,
	"total_correct" integer DEFAULT 0,
	"streak" integer DEFAULT 0,
	"last_study_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"user_id" varchar(36) NOT NULL,
	"prompt" jsonb DEFAULT '{}'::jsonb,
	"model" jsonb DEFAULT '{}'::jsonb,
	"context" jsonb DEFAULT '{}'::jsonb,
	"rag" jsonb DEFAULT '{}'::jsonb,
	"other" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_preference_user_id_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_message_id_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_round_id_game_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."game_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_player_id_game_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_lobby" ADD CONSTRAINT "game_lobby_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_lobby_id_game_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."game_lobby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_round" ADD CONSTRAINT "game_round_lobby_id_game_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."game_lobby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_round" ADD CONSTRAINT "game_round_question_id_flashcard_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."flashcard"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_document" ADD CONSTRAINT "rag_document_collection_id_rag_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."rag_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_stat" ADD CONSTRAINT "study_stat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_session_id_idx" ON "chat_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_message_timestamp_idx" ON "chat_message" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "chat_session_user_id_idx" ON "chat_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_user_id_idx" ON "flashcard" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcard_next_review_idx" ON "flashcard" USING btree ("next_review");--> statement-breakpoint
CREATE INDEX "game_answer_round_id_idx" ON "game_answer" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "game_answer_player_id_idx" ON "game_answer" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "game_lobby_code_idx" ON "game_lobby" USING btree ("code");--> statement-breakpoint
CREATE INDEX "game_lobby_host_idx" ON "game_lobby" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "game_player_lobby_id_idx" ON "game_player" USING btree ("lobby_id");--> statement-breakpoint
CREATE INDEX "game_round_lobby_id_idx" ON "game_round" USING btree ("lobby_id");--> statement-breakpoint
CREATE INDEX "rag_document_collection_id_idx" ON "rag_document" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "email_idx" ON "user" USING btree ("email");
// Database schema for the Flashcard SRS application
// Based on Python-to-TypeScript migration plan

import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  uuid,
  real,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Create tables without a prefix for cleaner names
 */
export const createTable = pgTableCreator(
  (name) => `${name}`,
);

/**
 * Users table - connected to Supabase Auth
 */
export const users = createTable(
  "user",
  (t) => ({
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("email_idx").on(t.email),
  ]
);

export const userRelations = relations(users, ({ many }) => ({
  flashcards: many(flashcards),
  studyStats: many(studyStats),
  chatSessions: many(chatSessions),
  gameLobbyHost: many(gameLobbies, { relationName: "host" }),
  gamePlayers: many(gamePlayers),
}));

/**
 * User preferences for app settings
 */
export const userPreferences = createTable(
  "user_preference",
  (t) => ({
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: jsonb("prompt").default({}),
    model: jsonb("model").default({}),
    context: jsonb("context").default({}),
    rag: jsonb("rag").default({}),
    other: jsonb("other").default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    primaryKey({ columns: [t.userId] }),
  ]
);

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

/**
 * Flashcards table - core data structure
 */
export const flashcards = createTable(
  "flashcard",
  (t) => ({
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    title: varchar("title", { length: 256 }).default(""),
    imageUrl: varchar("image_url", { length: 2048 }).default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    tags: jsonb("tags").default([]),
    // SRS algorithm fields
    repetitions: integer("repetitions").default(0),
    easeFactor: real("ease_factor").default(2.5),
    interval: integer("interval").default(1),
    nextReview: timestamp("next_review", { withTimezone: true }),
    lastReview: timestamp("last_review", { withTimezone: true }),
    // Metadata
    aiGenerated: boolean("ai_generated").default(false),
  }),
  (t) => [
    index("flashcard_user_id_idx").on(t.userId),
    index("flashcard_next_review_idx").on(t.nextReview),
  ]
);

export const flashcardRelations = relations(flashcards, ({ one, many }) => ({
  user: one(users, {
    fields: [flashcards.userId],
    references: [users.id],
  }),
  gameRounds: many(gameRounds),
}));

/**
 * Study statistics for tracking progress
 */
export const studyStats = createTable(
  "study_stat",
  (t) => ({
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studiedToday: integer("studied_today").default(0),
    totalStudied: integer("total_studied").default(0),
    correctToday: integer("correct_today").default(0),
    totalCorrect: integer("total_correct").default(0),
    streak: integer("streak").default(0),
    lastStudyDate: timestamp("last_study_date", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  }),
);

export const studyStatsRelations = relations(studyStats, ({ one }) => ({
  user: one(users, {
    fields: [studyStats.userId],
    references: [users.id],
  }),
}));

/**
 * Chat sessions
 */
export const chatSessions = createTable(
  "chat_session",
  (t) => ({
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 })
      .default("New Chat")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("chat_session_user_id_idx").on(t.userId),
  ]
);

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

/**
 * Chat messages
 */
export const chatMessages = createTable(
  "chat_message",
  (t) => ({
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system'
    content: text("content").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    metrics: jsonb("metrics").default({}), // input_tokens, output_tokens, response_time
  }),
  (t) => [
    index("chat_message_session_id_idx").on(t.sessionId),
    index("chat_message_timestamp_idx").on(t.timestamp),
  ]
);

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  feedback: many(feedback),
}));

/**
 * Message feedback
 */
export const feedback = createTable(
  "feedback",
  (t) => ({
    id: serial("id").primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  message: one(chatMessages, {
    fields: [feedback.messageId],
    references: [chatMessages.id],
  }),
}));

/**
 * RAG Collections
 */
export const ragCollections = createTable(
  "rag_collection",
  (t) => ({
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    unique().on(t.name),
  ]
);

export const ragCollectionsRelations = relations(ragCollections, ({ many }) => ({
  documents: many(ragDocuments),
}));

/**
 * RAG Documents
 */
export const ragDocuments = createTable(
  "rag_document",
  (t) => ({
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => ragCollections.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    metadata: jsonb("metadata").default({}),
    // For pgvector, you'll need to enable the extension and use vector type
    // embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("rag_document_collection_id_idx").on(t.collectionId),
  ]
);

export const ragDocumentsRelations = relations(ragDocuments, ({ one }) => ({
  collection: one(ragCollections, {
    fields: [ragDocuments.collectionId],
    references: [ragCollections.id],
  }),
}));

/**
 * Multiplayer Game Lobbies
 */
export const gameLobbies = createTable(
  "game_lobby",
  (t) => ({
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 8 }).notNull().unique(),
    hostUserId: varchar("host_user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 20 }).default("waiting").notNull(), // waiting, active, completed
    flashcardSetId: uuid("flashcard_set_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("game_lobby_code_idx").on(t.code),
    index("game_lobby_host_idx").on(t.hostUserId),
  ]
);

export const gameLobbiesRelations = relations(gameLobbies, ({ one, many }) => ({
  host: one(users, {
    fields: [gameLobbies.hostUserId],
    references: [users.id],
    relationName: "host",
  }),
  players: many(gamePlayers),
  rounds: many(gameRounds),
}));

/**
 * Game Players
 */
export const gamePlayers = createTable(
  "game_player",
  (t) => ({
    id: serial("id").primaryKey(),
    lobbyId: integer("lobby_id")
      .notNull()
      .references(() => gameLobbies.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    score: integer("score").default(0),
    status: varchar("status", { length: 20 }).default("joined").notNull(), // joined, ready, playing, left
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("game_player_lobby_id_idx").on(t.lobbyId),
    unique().on(t.lobbyId, t.userId),
  ]
);

export const gamePlayersRelations = relations(gamePlayers, ({ one, many }) => ({
  lobby: one(gameLobbies, {
    fields: [gamePlayers.lobbyId],
    references: [gameLobbies.id],
  }),
  user: one(users, {
    fields: [gamePlayers.userId],
    references: [users.id],
  }),
  answers: many(gameAnswers),
}));

/**
 * Game Rounds
 */
export const gameRounds = createTable(
  "game_round",
  (t) => ({
    id: serial("id").primaryKey(),
    lobbyId: integer("lobby_id")
      .notNull()
      .references(() => gameLobbies.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => flashcards.id),
    roundNumber: integer("round_number").notNull(),
    startTime: timestamp("start_time", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed
  }),
  (t) => [
    index("game_round_lobby_id_idx").on(t.lobbyId),
    unique().on(t.lobbyId, t.roundNumber),
  ]
);

export const gameRoundsRelations = relations(gameRounds, ({ one, many }) => ({
  lobby: one(gameLobbies, {
    fields: [gameRounds.lobbyId],
    references: [gameLobbies.id],
  }),
  question: one(flashcards, {
    fields: [gameRounds.questionId],
    references: [flashcards.id],
  }),
  answers: many(gameAnswers),
}));

/**
 * Game Answers
 */
export const gameAnswers = createTable(
  "game_answer",
  (t) => ({
    id: serial("id").primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => gameRounds.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
    answerText: text("answer_text").notNull(),
    timeTaken: integer("time_taken").notNull(), // milliseconds
    isCorrect: boolean("is_correct").default(false),
    pointsAwarded: integer("points_awarded").default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("game_answer_round_id_idx").on(t.roundId),
    index("game_answer_player_id_idx").on(t.playerId),
    unique().on(t.roundId, t.playerId),
  ]
);

export const gameAnswersRelations = relations(gameAnswers, ({ one }) => ({
  round: one(gameRounds, {
    fields: [gameAnswers.roundId],
    references: [gameRounds.id],
  }),
  player: one(gamePlayers, {
    fields: [gameAnswers.playerId],
    references: [gamePlayers.id],
  }),
}));

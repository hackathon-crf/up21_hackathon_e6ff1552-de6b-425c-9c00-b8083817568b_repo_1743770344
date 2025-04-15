import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTableCreator,
	primaryKey,
	real,
	serial,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
	varchar,
	// vector, // Import vector if you enable pgvector extension
} from "drizzle-orm/pg-core";

/**
 * Create tables without a prefix for cleaner names
 */
export const createTable = pgTableCreator((name) => `${name}`);

// ==========================================
// User and Authentication Related Tables
// ==========================================

/**
 * Users table - connected to Supabase Auth
 * Merged from both files, using File 2's structure (snake_case, $onUpdate, index)
 */
export const users = createTable(
	"user", // Table name in the database
	(t) => ({
		id: varchar("id", { length: 36 }).primaryKey(), // Corresponds to Supabase Auth user ID
		email: varchar("email", { length: 256 }).notNull().unique(),
		createdAt: timestamp("created_at", { withTimezone: true }) // Changed from 'createdAt' to 'created_at'
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }) // Changed from 'updatedAt' to 'updated_at'
			.default(sql`CURRENT_TIMESTAMP`) // Default for creation
			.$onUpdate(() => new Date()), // Use $onUpdate for updates
	}),
	(t) => [
		index("user_email_idx").on(t.email), // Renamed index for clarity
	],
);

/**
 * User preferences for app settings
 * Merged from both files, using File 2's structure (snake_case, $onUpdate, defaults, separate PK)
 * FIX: Ensure only one primary key definition exists.
 */
export const userPreferences = createTable(
	"user_preference", // Table name in the database
	(t) => ({
		// Make sure .primaryKey() is NOT defined inline here
		userId: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // No .primaryKey() here

		// Other columns remain the same
		prompt: jsonb("prompt").default({}),
		model: jsonb("model").default({}),
		context: jsonb("context").default({}),
		rag: jsonb("rag").default({}),
		other: jsonb("other").default({}),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	// Define the primary key ONLY here
	(t) => [primaryKey({ columns: [t.userId] })],
);

// ==========================================
// Flashcard and Study Related Tables
// ==========================================

/**
 * Flashcard decks table
 * From File 2
 */
export const flashcardDecks = createTable(
	"flashcard_deck", // Table name in the database
	(t) => ({
		id: uuid("id").defaultRandom().primaryKey(),
		userId: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description").default(""),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [index("flashcard_deck_user_id_idx").on(t.userId)],
);

/**
 * Flashcards table - core data structure
 * From File 2
 */
export const flashcards = createTable(
	"flashcard", // Table name in the database
	(t) => ({
		id: uuid("id").defaultRandom().primaryKey(),
		userId: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		deckId: uuid("deck_id").references(() => flashcardDecks.id, {
			onDelete: "cascade",
		}), // Nullable if card doesn't belong to a deck
		question: text("question").notNull(),
		answer: text("answer").notNull(),
		title: varchar("title", { length: 256 }).default(""),
		imageUrl: varchar("image_url", { length: 2048 }).default(""),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		tags: jsonb("tags").default([]),
		// SRS algorithm fields
		repetitions: integer("repetitions").default(0).notNull(),
		easeFactor: real("ease_factor").default(2.5).notNull(),
		interval: integer("interval").default(1).notNull(), // Days
		nextReview: timestamp("next_review", { withTimezone: true }),
		lastReview: timestamp("last_review", { withTimezone: true }),
		// Metadata
		aiGenerated: boolean("ai_generated").default(false).notNull(),
	}),
	(t) => [
		index("flashcard_user_id_idx").on(t.userId),
		index("flashcard_deck_id_idx").on(t.deckId),
		index("flashcard_next_review_idx").on(t.nextReview),
	],
);

/**
 * Study statistics for tracking progress
 * From File 2
 */
export const studyStats = createTable(
	"study_stat", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		studiedToday: integer("studied_today").default(0).notNull(),
		totalStudied: integer("total_studied").default(0).notNull(),
		correctToday: integer("correct_today").default(0).notNull(),
		totalCorrect: integer("total_correct").default(0).notNull(),
		streak: integer("streak").default(0).notNull(),
		lastStudyDate: timestamp("last_study_date", { withTimezone: true }),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [
		// Optional: Add unique constraint if only one stat row per user is desired
		// unique().on(t.userId),
		index("study_stat_user_id_idx").on(t.userId),
	],
);

// ==========================================
// Chat Related Tables
// ==========================================

/**
 * Chat sessions
 * Merged from both files, using File 2's structure (snake_case, $onUpdate, index)
 */
export const chatSessions = createTable(
	"chat_session", // Table name in the database
	(t) => ({
		id: uuid("id").defaultRandom().primaryKey(),
		user_id: varchar("user_id", { length: 36 }) // Changed from camelCase to snake_case
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 256 }).default("New Chat").notNull(),
		// Add position field for manual ordering within user's sessions
		position: integer("position").default(0).notNull(),
		// Add is_pinned field for pinned chats
		is_pinned: boolean("is_pinned").default(false).notNull(),
		// Add status field for active/archived/deleted
		status: varchar("status", { length: 20 }).default("active").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }) // Changed from camelCase to snake_case
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }) // Changed from camelCase to snake_case
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [
		index("chat_session_user_id_idx").on(t.user_id),
		// Index on updated_at for sorting by most recent
		index("chat_session_updated_at_idx").on(t.updated_at),
		// Combined index for user_id + position for efficient ordering
		index("chat_session_user_position_idx").on(t.user_id, t.position),
		// Index for status to quickly filter
		index("chat_session_status_idx").on(t.status),
	],
);

/**
 * Chat messages
 * Merged from both files, using File 2's structure (snake_case, defaults, indices)
 * Includes 'sources' column from File 1.
 */
export const chatMessages = createTable(
	"chat_message", // Table name in the database
	(t) => ({
		id: uuid("id").defaultRandom().primaryKey(),
		session_id: uuid("session_id") // Changed from camelCase to snake_case
			.notNull()
			.references(() => chatSessions.id, { onDelete: "cascade" }),
		role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system'
		content: text("content").notNull(),
		timestamp: timestamp("timestamp", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		metrics: jsonb("metrics").default({}), // e.g., input_tokens, output_tokens, response_time
		sources: jsonb("sources"), // Added from File 1 - documents or context used for response
	}),
	(t) => [
		index("chat_message_session_id_idx").on(t.session_id),
		index("chat_message_timestamp_idx").on(t.timestamp),
	],
);

/**
 * Message feedback
 * Merged from both files, using File 2's structure (snake_case)
 */
export const feedback = createTable(
	"feedback", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		message_id: uuid("message_id") // Changed from camelCase to snake_case
			.notNull()
			.references(() => chatMessages.id, { onDelete: "cascade" }), // References merged chatMessages table
		rating: integer("rating").notNull(), // e.g., 1-5 or simple up/down like -1/1
		comments: text("comments"),
		created_at: timestamp("created_at", { withTimezone: true }) // Changed from camelCase to snake_case
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("feedback_message_id_idx").on(t.message_id), // Updated to use snake_case
	],
);

// ==========================================
// RAG Related Tables
// ==========================================

/**
 * RAG Collections
 * From File 2
 */
export const ragCollections = createTable(
	"rag_collection", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [
		unique("rag_collection_name_uq").on(t.name), // Renamed unique constraint
	],
);

/**
 * RAG Documents
 * From File 2
 * Note: Enable pgvector extension in your DB and uncomment/adjust 'embedding' field if needed
 */
export const ragDocuments = createTable(
	"rag_document", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		collectionId: integer("collection_id")
			.notNull()
			.references(() => ragCollections.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		metadata: jsonb("metadata").default({}),
		// For pgvector:
		// embedding: vector("embedding", { dimensions: 1536 }), // Example dimension, adjust as needed
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("rag_document_collection_id_idx").on(t.collectionId),
		// Optional: Index for vector similarity search (requires pgvector)
		// index("rag_document_embedding_idx", { method: "hnsw", columns: [t.embedding], opclass: "vector_cosine_ops"}),
	],
);

// ==========================================
// Multiplayer Game Related Tables
// ==========================================

/**
 * Multiplayer Game Lobbies
 * From File 2
 */
export const gameLobbies = createTable(
	"game_lobby", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 8 }).notNull().unique(),
		hostUserId: varchar("host_user_id", { length: 36 })
			.notNull()
			.references(() => users.id), // onDelete: set null? cascade? depends on logic
		status: varchar("status", { length: 20 }).default("waiting").notNull(), // waiting, active, completed
		// Optional: Link lobby to a specific deck or set of flashcards
		flashcardDeckId: uuid("flashcard_deck_id").references(
			() => flashcardDecks.id,
			{ onDelete: "set null" },
		),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [
		index("game_lobby_code_idx").on(t.code),
		index("game_lobby_host_idx").on(t.hostUserId),
		index("game_lobby_deck_id_idx").on(t.flashcardDeckId),
	],
);

/**
 * Game Players (Participants in a Lobby)
 * From File 2
 */
export const gamePlayers = createTable(
	"game_player", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		lobbyId: integer("lobby_id")
			.notNull()
			.references(() => gameLobbies.id, { onDelete: "cascade" }),
		userId: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // Cascade delete if user is deleted
		nickname: varchar("nickname", { length: 50 }).notNull(),
		score: integer("score").default(0).notNull(),
		status: varchar("status", { length: 20 }).default("joined").notNull(), // joined, ready, playing, left
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("game_player_lobby_id_idx").on(t.lobbyId),
		index("game_player_user_id_idx").on(t.userId), // Added index on user_id
		unique("game_player_lobby_user_uq").on(t.lobbyId, t.userId), // Renamed unique constraint
	],
);

/**
 * Game Rounds (Questions within a Lobby)
 * From File 2
 */
export const gameRounds = createTable(
	"game_round", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		lobbyId: integer("lobby_id")
			.notNull()
			.references(() => gameLobbies.id, { onDelete: "cascade" }),
		// Using flashcard as the source of the question
		questionId: uuid("question_id")
			.notNull()
			.references(() => flashcards.id, { onDelete: "cascade" }), // Cascade if flashcard deleted? Or set null?
		roundNumber: integer("round_number").notNull(),
		startTime: timestamp("start_time", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		endTime: timestamp("end_time", { withTimezone: true }),
		status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed
	}),
	(t) => [
		index("game_round_lobby_id_idx").on(t.lobbyId),
		index("game_round_question_id_idx").on(t.questionId), // Added index on question_id
		unique("game_round_lobby_number_uq").on(t.lobbyId, t.roundNumber), // Renamed unique constraint
	],
);

/**
 * Game Answers (Player responses to a Round's Question)
 * From File 2
 */
export const gameAnswers = createTable(
	"game_answer", // Table name in the database
	(t) => ({
		id: serial("id").primaryKey(),
		roundId: integer("round_id")
			.notNull()
			.references(() => gameRounds.id, { onDelete: "cascade" }),
		playerId: integer("player_id")
			.notNull()
			.references(() => gamePlayers.id, { onDelete: "cascade" }),
		answerText: text("answer_text"), // Nullable if answer format is different (e.g., multiple choice ID)
		timeTaken: integer("time_taken"), // milliseconds, nullable if not timed
		isCorrect: boolean("is_correct"), // Nullable if correctness is determined later or irrelevant
		pointsAwarded: integer("points_awarded").default(0).notNull(),
		submittedAt: timestamp("submitted_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("game_answer_round_id_idx").on(t.roundId),
		index("game_answer_player_id_idx").on(t.playerId),
		unique("game_answer_round_player_uq").on(t.roundId, t.playerId), // Renamed unique constraint
	],
);

// ==========================================
// Define Relationships
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
	// Changed 'preferences' to 'userPreference' for consistency with table name
	userPreference: one(userPreferences, {
		fields: [users.id],
		references: [userPreferences.userId],
	}),
	flashcards: many(flashcards),
	flashcardDecks: many(flashcardDecks),
	studyStats: many(studyStats), // Assuming one user can have multiple stat entries over time, or just one
	chatSessions: many(chatSessions),
	// Relations for Game Lobbies
	hostedGameLobbies: many(gameLobbies, { relationName: "host" }), // Explicit relation name for host
	gamePlayers: many(gamePlayers), // User can be a player in many games
}));

export const userPreferencesRelations = relations(
	userPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [userPreferences.userId],
			references: [users.id],
		}),
	}),
);

export const flashcardDeckRelations = relations(
	flashcardDecks,
	({ one, many }) => ({
		user: one(users, {
			fields: [flashcardDecks.userId],
			references: [users.id],
		}),
		flashcards: many(flashcards),
		gameLobbies: many(gameLobbies), // A deck can be used in multiple game lobbies
	}),
);

export const flashcardRelations = relations(flashcards, ({ one, many }) => ({
	user: one(users, {
		fields: [flashcards.userId],
		references: [users.id],
	}),
	deck: one(flashcardDecks, {
		fields: [flashcards.deckId],
		references: [flashcardDecks.id],
	}),
	// A flashcard can be used as a question in multiple game rounds
	gameRounds: many(gameRounds),
}));

export const studyStatsRelations = relations(studyStats, ({ one }) => ({
	user: one(users, {
		fields: [studyStats.userId],
		references: [users.id],
	}),
}));

export const chatSessionsRelations = relations(
	chatSessions,
	({ one, many }) => ({
		user: one(users, {
			fields: [chatSessions.user_id],
			references: [users.id],
		}),
		messages: many(chatMessages), // Changed to reference merged chatMessages table
	}),
);

export const chatMessagesRelations = relations(
	chatMessages,
	({ one, many }) => ({
		session: one(chatSessions, {
			fields: [chatMessages.session_id],
			references: [chatSessions.id],
		}),
		// Changed 'feedbacks' to 'feedback' for consistency
		feedback: many(feedback), // Changed to reference merged feedback table
	}),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
	message: one(chatMessages, {
		// Changed to reference merged chatMessages table
		fields: [feedback.message_id],
		references: [chatMessages.id],
	}),
}));

export const ragCollectionsRelations = relations(
	ragCollections,
	({ many }) => ({
		documents: many(ragDocuments),
	}),
);

export const ragDocumentsRelations = relations(ragDocuments, ({ one }) => ({
	collection: one(ragCollections, {
		fields: [ragDocuments.collectionId],
		references: [ragCollections.id],
	}),
}));

export const gameLobbiesRelations = relations(gameLobbies, ({ one, many }) => ({
	host: one(users, {
		fields: [gameLobbies.hostUserId],
		references: [users.id],
		relationName: "host", // Match relation name in usersRelations
	}),
	players: many(gamePlayers),
	rounds: many(gameRounds),
	flashcardDeck: one(flashcardDecks, {
		// Relation to the deck used for the game
		fields: [gameLobbies.flashcardDeckId],
		references: [flashcardDecks.id],
	}),
}));

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

export const gameRoundsRelations = relations(gameRounds, ({ one, many }) => ({
	lobby: one(gameLobbies, {
		fields: [gameRounds.lobbyId],
		references: [gameLobbies.id],
	}),
	// Changed name 'question' to 'flashcardQuestion' for clarity
	flashcardQuestion: one(flashcards, {
		fields: [gameRounds.questionId],
		references: [flashcards.id],
	}),
	answers: many(gameAnswers),
}));

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

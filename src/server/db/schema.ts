import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTableCreator,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
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
		emailVerified: boolean("email_verified").default(false).notNull(), // Track email verification status
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
 * User preferences for settings persistence
 */
export const userPreferences = createTable(
	"user_preference",
	(t) => ({
		id: uuid("id").defaultRandom().primaryKey(),
		user_id: varchar("user_id", { length: 36 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" })
			.unique(), // One preference record per user
		// Learning preferences
		study_reminder_time: integer("study_reminder_time").default(18).notNull(), // Hour of day (0-23)
		cards_per_day: integer("cards_per_day").default(20).notNull(),
		weekend_reminders: boolean("weekend_reminders").default(true).notNull(),
		// Theme preferences
		theme: varchar("theme", { length: 20 }).default("system").notNull(), // light, dark, system
		// Notification preferences
		study_notifications: boolean("study_notifications").default(true).notNull(),
		achievement_notifications: boolean("achievement_notifications")
			.default(true)
			.notNull(),
		email_notifications: boolean("email_notifications")
			.default(false)
			.notNull(),
		// Privacy preferences
		share_activity: boolean("share_activity").default(true).notNull(),
		data_collection: boolean("data_collection").default(true).notNull(),
		// Timestamps
		created_at: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.$onUpdate(() => new Date()),
	}),
	(t) => [index("user_preference_user_id_idx").on(t.user_id)],
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
 * Core message storage for chat conversations
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
		// Note: 'sources' field removed as it was never populated or used
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
// Define Relationships
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
	userPreference: one(userPreferences, {
		fields: [users.id],
		references: [userPreferences.user_id],
	}),
	chatSessions: many(chatSessions),
}));

export const userPreferencesRelations = relations(
	userPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [userPreferences.user_id],
			references: [users.id],
		}),
	}),
);

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

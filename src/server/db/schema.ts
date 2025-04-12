import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

// Utility to create tables with the same prefix
const createTable = pgTableCreator((name) => `${name}`);

// User table is managed by Supabase Auth but referenced here
export const user = createTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// User preferences
export const userPreference = createTable("user_preference", {
  userId: varchar("userId", { length: 36 })
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  prompt: jsonb("prompt"),
  model: jsonb("model"),
  context: jsonb("context"),
  rag: jsonb("rag"),
  other: jsonb("other"),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Chat sessions
export const chatSession = createTable("chat_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("userId", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 256 }).default("New Chat"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Chat messages
export const chatMessage = createTable("chat_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .notNull()
    .references(() => chatSession.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  metrics: jsonb("metrics"),
  sources: jsonb("sources"),
});

// Feedback for chat messages
export const feedback = createTable("feedback", {
  id: serial("id").primaryKey(),
  messageId: uuid("messageId")
    .notNull()
    .references(() => chatMessage.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Define relationships
export const userRelations = relations(user, ({ many, one }) => ({
  preferences: one(userPreference),
  chatSessions: many(chatSession),
}));

export const chatSessionRelations = relations(chatSession, ({ one, many }) => ({
  user: one(user, {
    fields: [chatSession.userId],
    references: [user.id],
  }),
  messages: many(chatMessage),
}));

export const chatMessageRelations = relations(chatMessage, ({ one, many }) => ({
  session: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
  feedbacks: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  message: one(chatMessage, {
    fields: [feedback.messageId],
    references: [chatMessage.id],
  }),
}));
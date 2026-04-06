// Auth-specific tables — imported alongside main schema

import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // random token
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const magicTokens = pgTable('magic_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────────────────────────────

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const magicTokensRelations = relations(magicTokens, ({ one }) => ({
  user: one(users, {
    fields: [magicTokens.email],
    references: [users.email],
  }),
}));

import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  real,
  date,
  unique,
} from 'drizzle-orm/pg-core';

// ── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Intake Sessions ──────────────────────────────────────────────────────────
export const intakeSessions = pgTable('intake_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  status: text('status', {
    enum: ['in_progress', 'completed', 'abandoned'],
  }).notNull().default('in_progress'),
  currentStage: integer('current_stage').default(0).notNull(),
  persona: text('persona', {
    enum: ['founder', 'engineer', 'consultant', 'explorer'],
  }),
  auditExperience: text('audit_experience', {
    enum: ['first_time', 'renewing', 'switching'],
  }),
  urgency: text('urgency', {
    enum: ['customer_requirement', 'fundraising', 'legal', 'proactive'],
  }),
  urgencyDeadline: date('urgency_deadline'),
  readinessScore: real('readiness_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// ── Intake Answers ───────────────────────────────────────────────────────────
export const intakeAnswers = pgTable(
  'intake_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => intakeSessions.id)
      .notNull(),
    questionId: text('question_id').notNull(),
    stage: integer('stage').notNull(),
    value: jsonb('value').notNull(),
    answeredBy: uuid('answered_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique('uq_session_question').on(table.sessionId, table.questionId)],
);

// ── Company Profiles ─────────────────────────────────────────────────────────
export const companyProfiles = pgTable('company_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => intakeSessions.id)
    .unique()
    .notNull(),
  name: text('name'),
  website: text('website'),
  size: text('size', {
    enum: ['1-5', '6-15', '16-50', '51-100', '101-200', '200+'],
  }),
  description: text('description'),
  aiDescription: text('ai_description'),
  industries: jsonb('industries'),
  foundedYear: integer('founded_year'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Gaps ─────────────────────────────────────────────────────────────────────
export const gaps = pgTable('gaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => intakeSessions.id)
    .notNull(),
  dimension: text('dimension').notNull(),
  severity: text('severity', {
    enum: ['p0', 'p1', 'p2', 'p3'],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sourceQuestion: text('source_question'),
  remediationHint: text('remediation_hint'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  intakeSessions: many(intakeSessions),
  intakeAnswers: many(intakeAnswers),
}));

export const intakeSessionsRelations = relations(intakeSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [intakeSessions.userId],
    references: [users.id],
  }),
  answers: many(intakeAnswers),
  companyProfile: one(companyProfiles),
  gaps: many(gaps),
}));

export const intakeAnswersRelations = relations(intakeAnswers, ({ one }) => ({
  session: one(intakeSessions, {
    fields: [intakeAnswers.sessionId],
    references: [intakeSessions.id],
  }),
  answeredByUser: one(users, {
    fields: [intakeAnswers.answeredBy],
    references: [users.id],
  }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
  session: one(intakeSessions, {
    fields: [companyProfiles.sessionId],
    references: [intakeSessions.id],
  }),
}));

export const gapsRelations = relations(gaps, ({ one }) => ({
  session: one(intakeSessions, {
    fields: [gaps.sessionId],
    references: [intakeSessions.id],
  }),
}));

import { pgTable, text, boolean, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// =====================
// Better Auth Models
// =====================

export const users = pgTable('User', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
  // GrantSync custom fields
  role: text('role').default('partner').notNull(),
  organizationId: text('organizationId'),
  interests: text('interests'),
  targetPopulation: text('targetPopulation'),
  minFunding: integer('minFunding'),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  trackedGrants: many(trackedGrants),
}));

export const sessions = pgTable('Session', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accounts = pgTable('Account', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const verifications = pgTable('Verification', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
});

// =====================
// GrantSync Models
// =====================

export const grants = pgTable('Grant', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  agency: text('agency').notNull(),
  amount: text('amount').notNull(),
  amountMin: integer('amountMin'),
  amountMax: integer('amountMax'),
  deadline: timestamp('deadline', { mode: 'date' }).notNull(),
  description: text('description').notNull(),
  url: text('url'),
  tags: text('tags').notNull(),
  // Enhanced fields for filtering
  issueArea: text('issueArea'),
  eligibilityCriteria: text('eligibilityCriteria'),
  kpis: text('kpis'),
  grantDuration: integer('grantDuration'),
  // Scraping metadata
  sourceId: text('sourceId').unique(),
  scrapedAt: timestamp('scrapedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const grantsRelations = relations(grants, ({ many }) => ({
  trackedBy: many(trackedGrants),
}));

export const trackedGrants = pgTable('TrackedGrant', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  grantId: text('grantId').notNull().references(() => grants.id, { onDelete: 'cascade' }),
  status: text('status').default('new').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  unique('userId_grantId').on(table.userId, table.grantId),
]);

export const trackedGrantsRelations = relations(trackedGrants, ({ one }) => ({
  user: one(users, {
    fields: [trackedGrants.userId],
    references: [users.id],
  }),
  grant: one(grants, {
    fields: [trackedGrants.grantId],
    references: [grants.id],
  }),
}));

export const organizations = pgTable('Organization', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parentId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
export type TrackedGrant = typeof trackedGrants.$inferSelect;
export type NewTrackedGrant = typeof trackedGrants.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

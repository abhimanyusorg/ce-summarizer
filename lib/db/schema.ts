import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Threads table
export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  product: text('product').notNull(),
  topic: text('topic').notNull(),
  subject: text('subject').notNull(),
  initiatedBy: text('initiated_by').notNull(),
  status: text('status').default('open'),
  priority: text('priority').default('medium'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  sender: text('sender').notNull(),
  timestamp: text('timestamp').notNull(),
  body: text('body').notNull(),
  sequenceNum: integer('sequence_num').notNull(),
});

// Summaries table
export const summaries = sqliteTable('summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: text('thread_id').notNull().unique().references(() => threads.id, { onDelete: 'cascade' }),
  summaryText: text('summary_text').notNull(),
  keyIssue: text('key_issue').notNull(),
  sentiment: text('sentiment').notNull(),
  recommendedAction: text('recommended_action').notNull(),
  currentStatus: text('current_status'),
  confidenceScore: real('confidence_score'),
  status: text('status').default('pending'),
  editedBy: text('edited_by'),
  editedAt: text('edited_at'),
  approvedAt: text('approved_at'),
  approvalNotes: text('approval_notes'),
  version: integer('version').default(1),
  metadata: text('metadata'), // JSON stored as text
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Audit log table
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: text('thread_id').references(() => threads.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  userId: text('user_id'),
  details: text('details'), // JSON stored as text
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// Type exports
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

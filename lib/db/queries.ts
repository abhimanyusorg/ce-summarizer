import { eq, desc, and, like, or } from 'drizzle-orm';
import db from './client';
import { threads, messages, summaries, auditLog } from './schema';
import type { Thread, Message, Summary } from './schema';

export interface ThreadWithMessages extends Thread {
  messages: Message[];
  summary?: Summary | null;
}

export interface ThreadsQuery {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Thread queries
export async function getAllThreads(query: ThreadsQuery = {}) {
  const { status, priority, search, limit = 50, offset = 0 } = query;

  const conditions = [];
  
  if (status) {
    conditions.push(eq(threads.status, status));
  }
  
  if (priority) {
    conditions.push(eq(threads.priority, priority));
  }
  
  if (search) {
    conditions.push(
      or(
        like(threads.subject, `%${search}%`),
        like(threads.topic, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(threads)
    .where(whereClause)
    .orderBy(desc(threads.createdAt))
    .limit(limit)
    .offset(offset);

  const total = await db
    .select({ count: threads.id })
    .from(threads)
    .where(whereClause);

  return {
    threads: results,
    total: total.length,
    hasMore: offset + results.length < total.length,
  };
}

export async function getThreadById(threadId: string): Promise<ThreadWithMessages | null> {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (!thread) return null;

  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: [messages.sequenceNum],
  });

  const summary = await db.query.summaries.findFirst({
    where: eq(summaries.threadId, threadId),
  });

  return {
    ...thread,
    messages: threadMessages,
    summary,
  };
}

// Summary queries
export async function getSummaryByThreadId(threadId: string) {
  return await db.query.summaries.findFirst({
    where: eq(summaries.threadId, threadId),
  });
}

export async function createSummary(data: {
  threadId: string;
  summaryText: string;
  keyIssue: string;
  sentiment: string;
  recommendedAction: string;
  confidenceScore?: number;
  metadata?: any;
}) {
  const result = await db.insert(summaries).values({
    ...data,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  }).returning();

  return result[0];
}

export async function updateSummary(
  summaryId: number,
  data: Partial<{
    summaryText: string;
    keyIssue: string;
    sentiment: string;
    recommendedAction: string;
    editedBy: string;
    editedAt: string;
    status: string;
    approvedAt: string;
    approvalNotes: string;
    version: number;
  }>
) {
  const result = await db
    .update(summaries)
    .set(data)
    .where(eq(summaries.id, summaryId))
    .returning();

  return result[0];
}

// Audit log queries
export async function createAuditLog(data: {
  threadId?: string;
  action: string;
  userId?: string;
  details?: any;
}) {
  return await db.insert(auditLog).values({
    ...data,
    details: data.details ? JSON.stringify(data.details) : null,
  });
}

// Analytics queries
export async function getAnalyticsOverview() {
  const allThreads = await db.select().from(threads);
  const allSummaries = await db.select().from(summaries);

  const totalThreads = allThreads.length;
  const summarizedThreads = allSummaries.length;
  const approvedSummaries = allSummaries.filter(s => s.status === 'approved').length;
  const pendingApproval = allSummaries.filter(s => s.status === 'pending').length;

  const sentimentCounts = allSummaries.reduce((acc, s) => {
    acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalThreads,
    summarizedThreads,
    approvedSummaries,
    pendingApproval,
    avgProcessingTime: 4.2, // Mock value
    avgEditRate: 0.15, // Mock value
    sentimentBreakdown: sentimentCounts,
  };
}

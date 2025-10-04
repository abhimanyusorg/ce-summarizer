import { seedDatabase } from '@/lib/seed-db'
import { getAllThreads, getThreadById, createSummary, updateSummary, createAuditLog, getAnalyticsOverview } from '@/lib/db/queries'
import { generateSummary } from '@/lib/nlp/openrouter'
import db from '@/lib/db/client'
import { threads, summaries, messages, auditLog } from '@/lib/db/schema'

// Mock the OpenRouter API to avoid real API calls during testing
jest.mock('@/lib/nlp/openrouter', () => ({
  generateSummary: jest.fn().mockResolvedValue({
    summary: 'Mock summary for testing purposes',
    keyIssue: 'Product quality',
    sentiment: 'frustrated',
    recommendedAction: 'Replace product',
    confidenceScore: 0.85
  })
}))

async function resetDatabase() {
  // Delete all data in reverse order of dependencies
  await db.delete(auditLog);
  await db.delete(messages);
  await db.delete(summaries);
  await db.delete(threads);
  return { success: true }
}

async function approveSummary(summaryId: number, approvalData: { status: string, approvalNotes: string }) {
  const result = await updateSummary(summaryId, {
    status: approvalData.status,
    approvedAt: new Date().toISOString(),
    approvalNotes: approvalData.approvalNotes,
  });

  // Create audit log
  await createAuditLog({
    threadId: result.threadId,
    action: approvalData.status,
    userId: 'test-user',
    details: {
      summaryId,
      notes: approvalData.approvalNotes,
    },
  });

  return { success: true, summary: result };
}

describe('CE Workflow Integration Tests', () => {
  beforeAll(async () => {
    // Reset database before tests
    await resetDatabase()
  }, 10000)

  afterAll(async () => {
    // Clean up after tests
    await resetDatabase()
  }, 10000)

  describe('Complete CE Workflow', () => {
    it('should execute full workflow: seed → summarize → edit → approve → reset', async () => {
      // 1. Seed data
      console.log('Step 1: Seeding data...')
      const seedResult = await seedDatabase()
      expect(seedResult.imported).toBeGreaterThan(0)

      // 2. Get threads to verify seeding worked
      console.log('Step 2: Verifying seeded data...')
      const threadsResult = await getAllThreads()
      expect(threadsResult.threads.length).toBeGreaterThan(0)

      const firstThread = threadsResult.threads[0]
      expect(firstThread.id).toBeDefined()

      // 3. Get full thread data for summary generation
      console.log('Step 3: Getting full thread data...')
      const fullThread = await getThreadById(firstThread.id)
      expect(fullThread).toBeDefined()
      expect(fullThread!.messages.length).toBeGreaterThan(0)

      // 4. Generate summary using the actual API logic
      console.log('Step 4: Generating summary...')
      const threadData = {
        order_id: fullThread!.orderId,
        product: fullThread!.product,
        topic: fullThread!.topic,
        initiated_by: fullThread!.initiatedBy,
        messages: fullThread!.messages.map(m => ({
          sender: m.sender,
          timestamp: m.timestamp,
          body: m.body,
        }))
      }

      const nlpResponse = await generateSummary(threadData)
      expect(nlpResponse).toBeDefined()
      expect(nlpResponse.summary).toBeDefined()

      // 5. Create summary in database
      console.log('Step 5: Creating summary in database...')
      const createdSummary = await createSummary({
        threadId: firstThread.id,
        summaryText: nlpResponse.summary,
        keyIssue: nlpResponse.keyIssue,
        sentiment: nlpResponse.sentiment,
        recommendedAction: nlpResponse.recommendedAction,
        confidenceScore: 0.85, // Mock confidence score
      })
      expect(createdSummary.id).toBeDefined()

      // 6. Edit summary
      console.log('Step 6: Editing summary...')
      const editedSummaryText = nlpResponse.summary + ' [Edited by CE Associate]'
      const editResult = await updateSummary(createdSummary.id, {
        summaryText: editedSummaryText,
        status: 'edited'
      })
      expect(editResult.id).toBe(createdSummary.id)

      // 7. Approve summary
      console.log('Step 7: Approving summary...')
      const approveResult = await approveSummary(createdSummary.id, {
        status: 'approved',
        approvalNotes: 'Accurate and well-written summary'
      })
      expect(approveResult.success).toBe(true)

      // 8. Verify analytics updated
      console.log('Step 8: Checking analytics...')
      const analytics = await getAnalyticsOverview()
      expect(analytics.totalThreads).toBeGreaterThan(0)
      expect(analytics.summarizedThreads).toBeGreaterThan(0)
      expect(analytics.approvedSummaries).toBeGreaterThan(0)

      // 9. Reset data
      console.log('Step 9: Resetting data...')
      const resetResult = await resetDatabase()
      expect(resetResult.success).toBe(true)

      // 10. Verify reset worked
      console.log('Step 10: Verifying reset...')
      const threadsAfterReset = await getAllThreads()
      expect(threadsAfterReset.threads.length).toBe(0)

      console.log('✅ Full CE workflow test completed successfully!')
    }, 30000)

    it('should handle rejection workflow', async () => {
      // Seed data
      await seedDatabase()

      // Get a thread
      const threadsResult = await getAllThreads()
      const thread = threadsResult.threads[0]

      // Get full thread data
      const fullThread = await getThreadById(thread.id)

      // Generate summary
      const threadData = {
        order_id: fullThread!.orderId,
        product: fullThread!.product,
        topic: fullThread!.topic,
        initiated_by: fullThread!.initiatedBy,
        messages: fullThread!.messages.map(m => ({
          sender: m.sender,
          timestamp: m.timestamp,
          body: m.body,
        }))
      }

      const nlpResponse = await generateSummary(threadData)

      // Create summary
      const createdSummary = await createSummary({
        threadId: thread.id,
        summaryText: nlpResponse.summary,
        keyIssue: nlpResponse.keyIssue,
        sentiment: nlpResponse.sentiment,
        recommendedAction: nlpResponse.recommendedAction,
        confidenceScore: 0.85,
      })

      // Reject summary
      const rejectResult = await approveSummary(createdSummary.id, {
        status: 'rejected',
        approvalNotes: 'Summary needs improvement - missing key details'
      })

      expect(rejectResult.success).toBe(true)

      console.log('✅ Rejection workflow test completed successfully!')
    }, 30000)
  })
})
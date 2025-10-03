import { NextResponse } from 'next/server';
import { getThreadById, getSummaryByThreadId, createSummary, createAuditLog } from '@/lib/db/queries';
import { generateSummary } from '@/lib/nlp/openrouter';
import { assessSummaryConfidence } from '@/lib/nlp/confidence-checker';
import { db } from '@/lib/db/client';
import { summaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { crmService } from '@/lib/crm/service';

/**
 * @swagger
 * /api/summaries/generate:
 *   post:
 *     summary: Generate a summary for a customer thread
 *     description: Generates an AI-powered summary of a customer experience thread, including key issues, sentiment, and recommended actions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - threadId
 *             properties:
 *               threadId:
 *                 type: string
 *                 description: The ID of the thread to summarize
 *               forceRegenerate:
 *                 type: boolean
 *                 description: Whether to regenerate the summary if it already exists
 *                 default: false
 *     responses:
 *       200:
 *         description: Summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     threadId:
 *                       type: string
 *                     summaryText:
 *                       type: string
 *                     keyIssue:
 *                       type: string
 *                     sentiment:
 *                       type: string
 *                       enum: [frustrated, neutral, satisfied, angry]
 *                     recommendedAction:
 *                       type: string
 *                     confidenceScore:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                     metadata:
 *                       type: object
 *                 processingTime:
 *                   type: number
 *                   description: Time taken to process in milliseconds
 *       400:
 *         description: Invalid request - threadId missing
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error during summary generation
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { threadId, forceRegenerate } = body;

    if (!threadId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'threadId is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Check if summary already exists
    const existingSummary = await getSummaryByThreadId(threadId);
    
    if (existingSummary && !forceRegenerate) {
      return NextResponse.json({
        summary: existingSummary,
        processingTime: Date.now() - startTime,
        cached: true,
      });
    }

    // If regenerating, delete the old summary first
    if (existingSummary && forceRegenerate) {
      await db.delete(summaries).where(eq(summaries.threadId, threadId));
    }

    // Fetch thread data
    const thread = await getThreadById(threadId);
    
    if (!thread) {
      return NextResponse.json(
        {
          error: {
            code: 'THREAD_NOT_FOUND',
            message: `Thread with ID ${threadId} not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Fetch CRM context for the customer
    let crmContext;
    try {
      // Extract customer email from the first customer message
      const customerMessage = thread.messages.find(m => m.sender === 'customer');
      if (customerMessage) {
        // Try to extract email from message body (simple pattern matching)
        const emailMatch = customerMessage.body.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          crmContext = await crmService.getCustomerContext(emailMatch[0]);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch CRM context, proceeding without it:', error);
    }

    // Generate summary using NLP
    const nlpResponse = await generateSummary({
      order_id: thread.orderId,
      product: thread.product,
      topic: thread.topic,
      initiated_by: thread.initiatedBy,
      messages: thread.messages.map(m => ({
        sender: m.sender,
        timestamp: m.timestamp,
        body: m.body,
      })),
    }, crmContext);

    // Assess confidence using LLM-based checker
    const confidenceAssessment = await assessSummaryConfidence(
      {
        order_id: thread.orderId,
        product: thread.product,
        topic: thread.topic,
        initiated_by: thread.initiatedBy,
        messages: thread.messages.map(m => ({
          sender: m.sender,
          timestamp: m.timestamp,
          body: m.body,
        })),
      },
      nlpResponse
    );

    // Save summary to database with enhanced confidence data
    const summary = await createSummary({
      threadId: thread.id,
      summaryText: nlpResponse.summary,
      keyIssue: nlpResponse.keyIssue,
      sentiment: nlpResponse.sentiment,
      recommendedAction: nlpResponse.recommendedAction,
      confidenceScore: confidenceAssessment.score,
      metadata: {
        additionalContext: nlpResponse.additionalContext,
        confidenceReasoning: confidenceAssessment.reasoning,
        confidenceIssues: confidenceAssessment.issues,
        confidenceStrengths: confidenceAssessment.strengths,
        criteriaScores: confidenceAssessment.criteriaScores,
      },
    });

    // Create audit log
    await createAuditLog({
      threadId: thread.id,
      action: forceRegenerate ? 'regenerate' : 'summarize',
      userId: 'system', // In production, get from auth
      details: {
        confidenceScore: confidenceAssessment.score,
        confidenceReasoning: confidenceAssessment.reasoning,
        model: 'deepseek/deepseek-chat-v3.1:free',
        processingTime: Date.now() - startTime,
        regenerated: forceRegenerate || false,
        llmConfidenceUsed: process.env.OPENROUTER_API_KEY ? true : false,
      },
    });

    return NextResponse.json({
      summary,
      processingTime: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'SUMMARY_GENERATION_ERROR',
          message: 'Failed to generate summary',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

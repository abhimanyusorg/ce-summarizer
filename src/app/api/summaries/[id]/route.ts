import { NextResponse } from 'next/server';
import { updateSummary, createAuditLog } from '@/lib/db/queries';
import db from '@/lib/db/client';
import { summaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @swagger
 * /api/summaries/{id}:
 *   put:
 *     summary: Update a summary
 *     description: Edit and update an existing summary with new content, sentiment, or actions.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The summary ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summaryText:
 *                 type: string
 *                 description: Updated summary text
 *               keyIssue:
 *                 type: string
 *                 description: Updated key issue
 *               sentiment:
 *                 type: string
 *                 enum: [frustrated, neutral, satisfied, angry]
 *                 description: Updated sentiment
 *               recommendedAction:
 *                 type: string
 *                 description: Updated recommended action
 *               editNotes:
 *                 type: string
 *                 description: Notes about the edit
 *               userId:
 *                 type: string
 *                 description: User making the edit
 *                 default: user
 *     responses:
 *       200:
 *         description: Summary updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     threadId:
 *                       type: string
 *                     summaryText:
 *                       type: string
 *                     keyIssue:
 *                       type: string
 *                     sentiment:
 *                       type: string
 *                     recommendedAction:
 *                       type: string
 *                     status:
 *                       type: string
 *                     version:
 *                       type: integer
 *       400:
 *         description: Invalid ID or request
 *       404:
 *         description: Summary not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const summaryId = parseInt(id);
    
    if (isNaN(summaryId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_ID',
            message: 'Summary ID must be a number',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      summaryText,
      keyIssue,
      sentiment,
      recommendedAction,
      editNotes,
      userId = 'user',
    } = body;

    // Check if summary exists
    const existing = await db.query.summaries.findFirst({
      where: eq(summaries.id, summaryId),
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: {
            code: 'SUMMARY_NOT_FOUND',
            message: `Summary with ID ${summaryId} not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Update summary
    const updated = await updateSummary(summaryId, {
      summaryText: summaryText || existing.summaryText,
      keyIssue: keyIssue || existing.keyIssue,
      sentiment: sentiment || existing.sentiment,
      recommendedAction: recommendedAction || existing.recommendedAction,
      editedBy: userId,
      editedAt: new Date().toISOString(),
      status: 'edited',
      version: (existing.version || 1) + 1,
    });

    // Create audit log
    await createAuditLog({
      threadId: existing.threadId,
      action: 'edit',
      userId,
      details: {
        summaryId,
        editNotes,
        changes: {
          summaryText: summaryText !== existing.summaryText,
          keyIssue: keyIssue !== existing.keyIssue,
          sentiment: sentiment !== existing.sentiment,
          recommendedAction: recommendedAction !== existing.recommendedAction,
        },
      },
    });

    return NextResponse.json({ summary: updated });
  } catch (error: any) {
    console.error('Error updating summary:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'UPDATE_SUMMARY_ERROR',
          message: 'Failed to update summary',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

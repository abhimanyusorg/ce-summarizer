import { NextResponse } from 'next/server';
import { updateSummary, createAuditLog } from '@/lib/db/queries';
import db from '@/lib/db/client';
import { summaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @swagger
 * /api/summaries/{id}/approve:
 *   post:
 *     summary: Approve or reject a summary
 *     description: Approve or reject a summary after review, updating its status and creating an audit log.
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Approval status
 *               notes:
 *                 type: string
 *                 description: Approval/rejection notes
 *               userId:
 *                 type: string
 *                 description: User performing the approval
 *                 default: user
 *     responses:
 *       200:
 *         description: Summary approved/rejected successfully
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
 *                     status:
 *                       type: string
 *                     approvedBy:
 *                       type: string
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid ID, status, or request
 *       404:
 *         description: Summary not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
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
    const { status, notes, userId = 'user' } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be either "approved" or "rejected"',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

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
      status,
      approvedAt: new Date().toISOString(),
      approvalNotes: notes,
    });

    // Create audit log
    await createAuditLog({
      threadId: existing.threadId,
      action: status,
      userId,
      details: {
        summaryId,
        notes,
      },
    });

    return NextResponse.json({ summary: updated });
  } catch (error: any) {
    console.error('Error approving summary:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'APPROVE_SUMMARY_ERROR',
          message: 'Failed to approve summary',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

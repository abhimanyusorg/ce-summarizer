import { NextResponse } from 'next/server';
import { getThreadById } from '@/lib/db/queries';

/**
 * @swagger
 * /api/threads/{id}:
 *   get:
 *     summary: Get a thread by ID
 *     description: Retrieve a specific customer experience thread with all its messages.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The thread ID
 *     responses:
 *       200:
 *         description: Thread details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 orderId:
 *                   type: string
 *                 product:
 *                   type: string
 *                 topic:
 *                   type: string
 *                 status:
 *                   type: string
 *                 priority:
 *                   type: string
 *                 initiatedBy:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sender:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                       body:
 *                         type: string
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = await getThreadById(id);

    if (!thread) {
      return NextResponse.json(
        {
          error: {
            code: 'THREAD_NOT_FOUND',
            message: `Thread with ID ${id} not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(thread);
  } catch (error: any) {
    console.error('Error fetching thread:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_THREAD_ERROR',
          message: 'Failed to fetch thread',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

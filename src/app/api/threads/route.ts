import { NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/db/queries';

/**
 * @swagger
 * /api/threads:
 *   get:
 *     summary: List threads
 *     description: Retrieve a list of customer experience threads with optional filtering and pagination.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by thread status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in thread content
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of threads to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of threads to skip
 *     responses:
 *       200:
 *         description: List of threads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       orderId:
 *                         type: string
 *                       product:
 *                         type: string
 *                       topic:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       initiatedBy:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await getAllThreads(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching threads:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_THREADS_ERROR',
          message: 'Failed to fetch threads',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

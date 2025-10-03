import { NextResponse } from 'next/server';
import { getAnalyticsOverview } from '@/lib/db/queries';

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Retrieve key metrics and analytics for the CE summarization system.
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalThreads:
 *                   type: integer
 *                   description: Total number of threads
 *                 totalSummaries:
 *                   type: integer
 *                   description: Total number of summaries
 *                 averageConfidence:
 *                   type: number
 *                   description: Average confidence score
 *                 sentimentDistribution:
 *                   type: object
 *                   properties:
 *                     frustrated:
 *                       type: integer
 *                     neutral:
 *                       type: integer
 *                     satisfied:
 *                       type: integer
 *                     angry:
 *                       type: integer
 *                 processingStats:
 *                   type: object
 *                   properties:
 *                     averageProcessingTime:
 *                       type: number
 *                     totalProcessingTime:
 *                       type: number
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const analytics = await getAnalyticsOverview();

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to fetch analytics',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

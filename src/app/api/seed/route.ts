import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed-db';

/**
 * @swagger
 * /api/seed:
 *   post:
 *     summary: Seed database with sample data
 *     description: Populates the database with initial sample customer service threads and messages. This will add data without removing existing records.
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database seeded successfully"
 *                 seedResult:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       description: Number of threads imported
 *                       example: 5
 *                     skipped:
 *                       type: integer
 *                       description: Number of threads skipped due to errors
 *                       example: 0
 *       500:
 *         description: Internal server error
 */
export async function POST() {
  try {
    // Seed the database with initial data
    const seedResult = await seedDatabase();

    return NextResponse.json({
      message: 'Database seeded successfully',
      seedResult
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SEED_ERROR',
          message: 'Failed to seed database',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
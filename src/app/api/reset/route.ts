import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threads, summaries, messages, auditLog } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/seed-db';

/**
 * @swagger
 * /api/reset:
 *   post:
 *     summary: Reset and reseed data
 *     description: Deletes all threads, summaries, messages, and audit logs from the database, then reseeds with initial sample data. Use with caution.
 *     responses:
 *       200:
 *         description: Data reset and reseeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data reset and reseeded successfully"
 *                 seedResult:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       example: 5
 *                     skipped:
 *                       type: integer
 *                       example: 0
 *       500:
 *         description: Internal server error
 */
export async function POST() {
  try {
    // Delete all data in reverse order of dependencies
    await db.delete(auditLog);
    await db.delete(messages);
    await db.delete(summaries);
    await db.delete(threads);

    // Seed the database with initial data
    const seedResult = await seedDatabase();

    return NextResponse.json({
      message: 'Data reset and reseeded successfully',
      seedResult
    });
  } catch (error: any) {
    console.error('Error resetting data:', error);
    return NextResponse.json(
      {
        error: {
          code: 'RESET_ERROR',
          message: 'Failed to reset data',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
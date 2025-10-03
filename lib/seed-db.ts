import { db } from './db/client';
import { threads, messages } from './db/schema';
import fs from 'fs';
import path from 'path';

/**
 * Seeds the database with initial data from ce_exercise_threads.json
 */
export async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Read the JSON data
    const jsonPath = path.join(process.cwd(), 'data', 'ce_exercise_threads.json');
    const fullData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const jsonData = fullData.threads || fullData;

    let imported = 0;
    let skipped = 0;

    for (const threadData of jsonData) {
      try {
        const threadId = threadData.thread_id || threadData.id;
        const status = threadData.status || 'open';
        const priority = threadData.priority || 'medium';

        // Insert thread
        await db.insert(threads).values({
          id: threadId,
          orderId: threadData.order_id,
          product: threadData.product,
          topic: threadData.topic,
          subject: threadData.subject,
          initiatedBy: threadData.initiated_by,
          status: status,
          priority: priority,
        }).onConflictDoUpdate({
          target: threads.id,
          set: {
            orderId: threadData.order_id,
            product: threadData.product,
            topic: threadData.topic,
            subject: threadData.subject,
            initiatedBy: threadData.initiated_by,
            status: status,
            priority: priority,
          }
        });

        // Insert messages
        for (let i = 0; i < threadData.messages.length; i++) {
          const message = threadData.messages[i];
          const uniqueMessageId = `${threadId}-${message.id}`;

          await db.insert(messages).values({
            id: uniqueMessageId,
            threadId: threadId,
            sender: message.sender,
            timestamp: message.timestamp,
            body: message.body,
            sequenceNum: message.sequence_num || i + 1,
          }).onConflictDoUpdate({
            target: messages.id,
            set: {
              threadId: threadId,
              sender: message.sender,
              timestamp: message.timestamp,
              body: message.body,
              sequenceNum: message.sequence_num || i + 1,
            }
          });
        }

        imported++;
        console.log(`✓ Imported thread: ${threadId}`);
      } catch (error) {
        console.error(`✗ Failed to import thread ${threadData.thread_id || threadData.id}:`, error);
        skipped++;
      }
    }

    console.log(`\nSeeding complete!`);
    console.log(`Imported: ${imported} threads`);
    console.log(`Skipped: ${skipped} threads`);

    return { imported, skipped };
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}
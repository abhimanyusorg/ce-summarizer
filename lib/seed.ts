import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Read the JSON data
const jsonPath = path.join(process.cwd(), 'data', 'ce_exercise_threads.json');
const fullData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const jsonData = fullData.threads || fullData;

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'ce_threads.db');

// Create database file if it doesn't exist
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);

// Create tables
console.log('Creating tables...');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT NOT NULL,
    initiated_by TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
  CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_threads_order_id ON threads(order_id);
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    body TEXT NOT NULL,
    sequence_num INTEGER NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sequence ON messages(thread_id, sequence_num);
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL UNIQUE,
    summary_text TEXT NOT NULL,
    key_issue TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    current_status TEXT,
    confidence_score REAL,
    status TEXT DEFAULT 'pending',
    edited_by TEXT,
    edited_at TEXT,
    approved_at TEXT,
    approval_notes TEXT,
    version INTEGER DEFAULT 1,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_summaries_status ON summaries(status);
  CREATE INDEX IF NOT EXISTS idx_summaries_thread_id ON summaries(thread_id);
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT,
    action TEXT NOT NULL,
    user_id TEXT,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_thread ON audit_log(thread_id);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
`);

console.log('Tables created successfully!');

// Seed data
console.log('Seeding data...');

let imported = 0;
let skipped = 0;

for (const threadData of jsonData) {
  try {
    const threadId = threadData.thread_id || threadData.id;
    const status = threadData.status || 'open';
    const priority = threadData.priority || 'medium';
    
    // Insert thread
    sqlite.prepare(`
      INSERT OR REPLACE INTO threads (id, order_id, product, topic, subject, initiated_by, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      threadId,
      threadData.order_id,
      threadData.product,
      threadData.topic,
      threadData.subject,
      threadData.initiated_by,
      status,
      priority
    );

    // Insert messages
    for (let i = 0; i < threadData.messages.length; i++) {
      const message = threadData.messages[i];
      const uniqueMessageId = `${threadId}-${message.id}`;
      sqlite.prepare(`
        INSERT OR REPLACE INTO messages (id, thread_id, sender, timestamp, body, sequence_num)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uniqueMessageId,
        threadId,
        message.sender,
        message.timestamp,
        message.body,
        message.sequence_num || i + 1
      );
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

sqlite.close();

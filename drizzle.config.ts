import type { Config } from 'drizzle-kit';

export default {
  dialect: 'sqlite',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: './data/ce_threads.db',
  },
} satisfies Config;

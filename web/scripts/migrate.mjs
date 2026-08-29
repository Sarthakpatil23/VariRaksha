import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function applyMigrations() {
  if (!DATABASE_URL || DATABASE_URL.includes('YOUR_PASSWORD') || DATABASE_URL.includes('placeholder')) {
    console.error(`
❌ DATABASE_URL is missing or placeholder.

To run automatic migrations like Prisma/Neon:
1. Go to Supabase Dashboard -> Project Settings -> Database -> Connection string (URI)
2. Copy the URI (e.g. postgresql://postgres:[YOUR-PASSWORD]@db.tbxlgbxlorsuiaoedrns.supabase.co:5432/postgres)
3. Add it to web/.env.local as:
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tbxlgbxlorsuiaoedrns.supabase.co:5432/postgres
4. Run: npm run db:push
`);
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database directly...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!');

    const sqlPath = path.resolve(process.cwd(), '../supabase/migrations/20260829_complete_schema.sql');
    console.log(`Reading migration file: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying complete schema, triggers, and RLS policies...');
    await client.query(sql);
    console.log('🎉 Migration successful! All tables, triggers, and policies are now live in Supabase!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();

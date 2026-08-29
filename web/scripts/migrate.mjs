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

    const migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      console.log(`\n📄 Executing migration: ${file}...`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log(`✅ ${file} applied successfully!`);
    }

    console.log('\n🎉 ALL DATABASE MIGRATIONS EXECUTED SUCCESSFULLY IN SUPABASE!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();

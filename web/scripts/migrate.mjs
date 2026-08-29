import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const { Client } = pg;

const rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function getConnectedClient() {
  const candidates = [];

  if (rawDbUrl && !rawDbUrl.includes('YOUR_PASSWORD') && !rawDbUrl.includes('placeholder')) {
    candidates.push({ name: 'Direct DATABASE_URL', url: rawDbUrl });
  }

  // Common Supabase pooler connection strings
  const projectRef = 'tbxlgbxlorsuiaoedrns';
  const password = 'abd3hhqX41Je5VqC';
  const regions = ['ap-south-1', 'ap-southeast-1', 'us-east-1', 'eu-central-1'];
  
  for (const r of regions) {
    candidates.push({
      name: `Supabase Pooler ${r}:6543`,
      url: `postgresql://postgres.${projectRef}:${password}@aws-0-${r}.pooler.supabase.com:6543/postgres`,
    });
    candidates.push({
      name: `Supabase Pooler ${r}:5432`,
      url: `postgresql://postgres.${projectRef}:${password}@aws-0-${r}.pooler.supabase.com:5432/postgres`,
    });
  }

  for (const candidate of candidates) {
    console.log(`Attempting connection via ${candidate.name}...`);
    const client = new Client({
      connectionString: candidate.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3500,
    });

    try {
      await client.connect();
      console.log(`✅ Successfully connected via ${candidate.name}!`);
      return client;
    } catch (err) {
      console.log(`⚠️ ${candidate.name} failed: ${err.message}`);
      try { await client.end(); } catch (_) {}
    }
  }

  return null;
}

async function applyMigrations() {
  console.log('🚀 Starting VariRaksha Database Migration...');

  const client = await getConnectedClient();

  if (!client) {
    console.error(`
❌ Could not connect directly to PostgreSQL.
Please ensure the SQL is executed in Supabase Dashboard SQL Editor.
`);
    process.exit(1);
  }

  try {
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
    console.error('❌ Migration query failed:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();

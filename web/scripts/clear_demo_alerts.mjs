import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;

async function clearDummyAlerts() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase DB. Clearing emergency_alerts table...');
  await client.query('TRUNCATE TABLE public.emergency_alerts CASCADE;');
  console.log('✅ emergency_alerts is now completely empty and clean with NO demo data!');
  await client.end();
}

clearDummyAlerts();

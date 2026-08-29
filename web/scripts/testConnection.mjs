import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase REST Client connection...');
console.log('URL:', url);
console.log('Key (prefix):', key ? key.slice(0, 20) + '...' : 'none');

const supabase = createClient(url, key);

async function test() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Auth getSession response:', error.message);
    } else {
      console.log('✅ Supabase Auth & REST API connected successfully! Session status: OK');
    }

    // Try a simple select
    const { data: profiles, error: tableErr } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (tableErr) {
      console.log('Table query info (expected if tables not yet created or RLS):', tableErr.message);
    } else {
      console.log('✅ Profiles table queried successfully!');
    }
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

test();

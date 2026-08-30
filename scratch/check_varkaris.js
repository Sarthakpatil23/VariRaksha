const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkVarkariNumbers() {
  const tables = ['varkari', 'varkaris', 'users', 'profiles', 'pilgrims', 'emergency_alerts'];
  
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(5);
      if (!error && data && data.length > 0) {
        console.log(`=== TABLE: ${t} (${data.length} rows) ===`);
        console.log(JSON.stringify(data, null, 2));
      } else if (error) {
        console.log(`Table ${t}: ${error.message}`);
      } else {
        console.log(`Table ${t}: 0 rows`);
      }
    } catch (e) {
      console.log(`Error checking ${t}:`, e.message);
    }
  }
}

checkVarkariNumbers();

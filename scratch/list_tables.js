const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
  const commonNames = [
    'varkari', 'varkaris', 'pilgrim', 'pilgrims', 'profiles', 'users', 'members',
    'emergency_contacts', 'dindis', 'dindi_members', 'emergency_alerts', 'volunteers'
  ];
  
  for (const name of commonNames) {
    const { data, error } = await supabase.from(name).select('*').limit(1);
    if (!error) {
      console.log(`Found Table: ${name}`);
    }
  }
}

listTables();

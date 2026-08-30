const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectContacts() {
  const { data: contacts, error } = await supabase.from('emergency_contacts').select('*').limit(10);
  console.log('=== EMERGENCY CONTACTS ===');
  console.log(contacts);

  const { data: profiles } = await supabase.from('profiles').select('*').limit(10);
  console.log('=== PROFILES ===');
  console.log(profiles);
}

inspectContacts();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPriorityRPC() {
  console.log('Testing get_prioritized_emergency_alerts RPC...');
  const { data, error } = await supabase.rpc('get_prioritized_emergency_alerts');
  if (error) {
    console.error('RPC failed:', error);
  } else {
    console.log('RPC succeeded! Returned rows:', data.length);
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  }
}

testPriorityRPC();

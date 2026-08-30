const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testStatus() {
  const alertId = crypto.randomUUID();
  const { data: created, error: crErr } = await supabase
    .from('emergency_alerts')
    .insert({
      id: alertId,
      pilgrim_name: 'Status Test',
      problem_type: 'Medical',
      severity: 'critical',
      status: 'nearby',
    })
    .select()
    .single();

  console.log('Created:', crErr || 'OK');

  // Try updating status to 'transferring_to_medical'
  const { data: u1, error: e1 } = await supabase
    .from('emergency_alerts')
    .update({ status: 'transferring_to_medical' })
    .eq('id', alertId)
    .select();

  console.log("Update status 'transferring_to_medical':", e1 ? e1.message : 'SUCCESS');

  await supabase.from('emergency_alerts').delete().eq('id', alertId);
}

testStatus();

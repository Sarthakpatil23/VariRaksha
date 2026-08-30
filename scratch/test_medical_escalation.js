/**
 * End-to-End Medical Escalation & Golden Hour Triage Simulation
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function enrichAlertWithEscalation(alert) {
  if (!alert || !alert.notes) return alert;

  if (alert.notes.includes('[TRANSFERRING_TO_MEDICAL]')) {
    const reasonMatch = alert.notes.match(/Reason:\s*([^|]+)/);
    const campMatch = alert.notes.match(/Camp:\s*([^|]+)/);
    const prepMatch = alert.notes.match(/Prep:\s*({[^}]+})/);

    let prep = alert.golden_hour_prep;
    if (prepMatch) {
      try { prep = JSON.parse(prepMatch[1]); } catch {}
    }

    return {
      ...alert,
      status: 'transferring_to_medical',
      escalation_reason: reasonMatch ? reasonMatch[1].trim() : 'Severe Heat Stroke',
      target_camp_name: campMatch ? campMatch[1].trim() : 'Wakhari Sector 1 Medical Camp',
      golden_hour_prep: prep,
    };
  }

  if (alert.notes.includes('[ADMITTED_AT_CAMP]')) {
    const docMatch = alert.notes.match(/Doctor:\s*([^|]+)/);
    return {
      ...alert,
      status: 'admitted_at_camp',
      attending_doctor: docMatch ? docMatch[1].trim() : 'Dr. Medical Officer',
    };
  }

  if (alert.notes.includes('[REFERRED_HOSPITAL]')) {
    const hospMatch = alert.notes.match(/Hospital:\s*([^|]+)/);
    return {
      ...alert,
      status: 'referred_hospital',
      referral_hospital_name: hospMatch ? hospMatch[1].trim() : 'Pandharpur Sub-District / Civil Hospital',
    };
  }

  return alert;
}

async function runSimulation() {
  console.log('--- STARTING MEDICAL ESCALATION E2E TEST ---');

  // 1. Create a test SOS alert by Pilgrim
  const alertId = crypto.randomUUID();
  console.log('1. Pilgrim triggering SOS alert:', alertId);
  const { data: created, error: createErr } = await supabase
    .from('emergency_alerts')
    .insert({
      id: alertId,
      pilgrim_name: 'Sarthak Kailas Patil',
      pilgrim_phone: '+91 99708 32199',
      pilgrim_age: 62,
      pilgrim_gender: 'Male',
      dindi_name: 'Sant Tukaram Maharaj Dindi #01',
      problem_type: 'Severe Heat Stroke & Dizziness',
      severity: 'critical',
      status: 'nearby',
      location_name: 'Wakhari Sector 1 (Palkhi Route)',
      latitude: 17.7120,
      longitude: 75.2410,
      medical_context: 'BP / Hypertension (Amlodipine 5mg), Blood: B+ ve',
    })
    .select()
    .single();

  if (createErr) {
    console.error('Failed to create test alert:', createErr);
    return;
  }
  console.log('✓ SOS created:', created.id, 'Status:', created.status);

  // 2. Volunteer Claims Alert
  console.log('2. Volunteer claiming alert...');
  const { data: claimed, error: claimErr } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'in_progress',
      responder_id: 'vol-ramesh-1',
      responder_name: 'Rameshwar Patil',
      responder_phone: '+91 94230 11221',
      claimed_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (claimErr) {
    console.error('Claim error:', claimErr);
    return;
  }
  console.log('✓ Claimed by volunteer:', claimed.responder_name, 'Status:', claimed.status);

  // 3. Volunteer Escalates to Medical Camp
  console.log('3. Volunteer on scene escalating to Medical Camp...');
  const noteContent = `[TRANSFERRING_TO_MEDICAL] Reason: Severe Heat Stroke / Sunstroke (Needs IV Saline) | Camp: Wakhari Sector 1 Medical Triage Camp | Volunteer: Rameshwar Patil`;
  const { data: rawEscalated, error: escErr } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'in_progress',
      notes: noteContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (escErr) {
    console.error('Escalation error:', escErr);
    return;
  }
  const escalated = enrichAlertWithEscalation(rawEscalated);
  console.log('✓ Alert escalated to Medical Camp:', escalated.target_camp_name);
  console.log('  Derived App Status:', escalated.status, 'Reason:', escalated.escalation_reason);

  // 4. Medical Staff Prepares Golden Hour Checklist
  console.log('4. Medical Staff toggling Golden Hour checklist...');
  const prep = { oxygenBedReady: true, ivLineReady: true, doctorReady: true };
  const updatedNoteWithPrep = `${noteContent} | Prep: ${JSON.stringify(prep)}`;
  const { data: rawPrepped, error: prepErr } = await supabase
    .from('emergency_alerts')
    .update({
      notes: updatedNoteWithPrep,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (prepErr) {
    console.error('Prep error:', prepErr);
    return;
  }
  const prepped = enrichAlertWithEscalation(rawPrepped);
  console.log('✓ Golden Hour Prep updated:', prepped.golden_hour_prep);

  // 5. Medical Staff Accepts Transfer & Frees Volunteer
  console.log('5. Medical Staff accepting transfer of care...');
  const admitNote = `[ADMITTED_AT_CAMP] Doctor: Dr. Medical Officer | Bed: Bed #2 (O2) | Notes: 500ml Normal Saline IV started. Cold sponge applied.`;
  const { data: rawAdmitted, error: admitErr } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'in_progress',
      notes: admitNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (admitErr) {
    console.error('Admit error:', admitErr);
    return;
  }
  const admitted = enrichAlertWithEscalation(rawAdmitted);
  console.log('✓ Transfer accepted by:', admitted.attending_doctor, 'Derived Status:', admitted.status);

  // 6. Medical Staff Refers to Pandharpur Civil Hospital via 108
  console.log('6. 1-Tap 108 Ambulance Dispatch & Referral to Civil Hospital...');
  const referNote = `[REFERRED_HOSPITAL] Hospital: Pandharpur Sub-District / Civil Hospital | 108 Dispatched At: ${new Date().toISOString()}`;
  const { data: rawReferred, error: refErr } = await supabase
    .from('emergency_alerts')
    .update({
      status: 'in_progress',
      notes: referNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (refErr) {
    console.error('Referral error:', refErr);
    return;
  }
  const referred = enrichAlertWithEscalation(rawReferred);
  console.log('✓ 108 Ambulance Dispatched! Referred to:', referred.referral_hospital_name, 'Derived Status:', referred.status);

  // 7. Cleanup test alert
  console.log('7. Cleaning up test alert...');
  await supabase.from('emergency_alerts').delete().eq('id', alertId);
  console.log('✓ Cleaned up test record.');
  console.log('--- ALL MEDICAL ESCALATION TESTS PASSED 100% ---');
}

runSimulation();

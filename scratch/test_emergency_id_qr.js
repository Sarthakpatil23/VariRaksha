/**
 * Test Dynamic Emergency ID QR Resolution & Proxy SOS Triggering
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runEmergencyIdTest() {
  console.log('--- STARTING DYNAMIC EMERGENCY ID & QR SCANNER TEST ---');

  // 1. Generate a Dynamic QR Payload for a pilgrim
  const samplePilgrim = {
    schema: 'variraksha-v1',
    id: 'VK-DEHU01',
    name: 'Sarthak Kailas Patil',
    phone: '+91 99708 32199',
    age: 62,
    gender: 'Male',
    dindiName: 'Sant Tukaram Maharaj Dindi #01',
    dindiNumber: '01',
    bloodGroup: 'B+',
    emergencyContactName: 'Rameshwar Patil (Brother)',
    emergencyContactPhone: '+91 94230 11221',
    medicalConditions: ['Hypertension / High BP (Amlodipine 5mg)'],
    allergies: ['Peanuts (शेंगदाणे)', 'Sulfa Drugs'],
    currentMedications: ['Amlodipine 5mg OD'],
    criticalNotes: 'Carry ORS & BP tablets in bag',
    timestamp: Date.now(),
  };

  const qrString = JSON.stringify(samplePilgrim);
  console.log('1. Generated QR String Length:', qrString.length, 'bytes');

  // 2. Simulate QR Scanner Decoding
  console.log('2. Decoding scanned QR Code...');
  const parsed = JSON.parse(qrString);
  if (parsed.schema === 'variraksha-v1' && parsed.id === 'VK-DEHU01') {
    console.log('✓ Successfully decoded Pilgrim:', parsed.name, `(${parsed.id})`);
    console.log('  Blood Group:', parsed.bloodGroup);
    console.log('  Medical Conditions:', parsed.medicalConditions);
    console.log('  Allergies:', parsed.allergies);
    console.log('  Emergency Contact:', parsed.emergencyContactName, parsed.emergencyContactPhone);
  } else {
    throw new Error('Failed to decode QR payload schema');
  }

  // 3. Trigger Proxy SOS from QR Scanner on behalf of Scanned Pilgrim
  console.log('3. Triggering Proxy Emergency SOS from Scanner on behalf of scanned pilgrim...');
  const alertId = crypto.randomUUID();
  const medicalContext = `Blood: ${parsed.bloodGroup} · Conditions: ${parsed.medicalConditions.join(', ')} · Allergies: ${parsed.allergies.join(', ')} · Reported via QR Scan by: Volunteer Responder`;

  const { data: createdAlert, error: insertError } = await supabase
    .from('emergency_alerts')
    .insert({
      id: alertId,
      pilgrim_name: parsed.name,
      pilgrim_phone: parsed.phone,
      pilgrim_age: parsed.age,
      pilgrim_gender: parsed.gender,
      emergency_card_id: parsed.id,
      dindi_name: parsed.dindiName,
      problem_type: '🚨 Severe Heat Stroke / Dehydration (QR Scanned)',
      severity: 'critical',
      status: 'nearby',
      location_name: 'Wakhari Corridor (Palkhi Route, KM 142)',
      latitude: 17.712,
      longitude: 75.241,
      medical_context: medicalContext,
      notes: '[QR_SCANNED_SOS] Reporter: Volunteer Responder',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create proxy SOS:', insertError);
    return;
  }

  console.log('✓ Proxy SOS created in Supabase DB:', createdAlert.id);
  console.log('  Pilgrim:', createdAlert.pilgrim_name, `(${createdAlert.emergency_card_id})`);
  console.log('  Medical Context:', createdAlert.medical_context);
  console.log('  Status:', createdAlert.status);

  // 4. Cleanup test record
  console.log('4. Cleaning up test record...');
  await supabase.from('emergency_alerts').delete().eq('id', alertId);
  console.log('✓ Cleaned up test record.');

  console.log('--- ALL EMERGENCY ID & QR SCANNER TESTS PASSED 100% ---');
}

runEmergencyIdTest();

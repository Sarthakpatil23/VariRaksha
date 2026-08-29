import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tbxlgbxlorsuiaoedrns.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAuthTest() {
  console.log('--- Testing Supabase Auth ---');

  // Test 1: Sign up a test coordinator account
  const testEmail = 'coordinator@variraksha.org';
  const testPassword = 'Password123!';

  console.log(`1. Testing SignUp for ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Sopan Patil',
        role: 'coordinator',
      },
    },
  });

  if (signUpError) {
    console.log('SignUp result:', signUpError.message);
  } else {
    console.log('SignUp success! User ID:', signUpData?.user?.id);
    console.log('Session present?', !!signUpData?.session);
  }

  // Test 2: Sign in with the account
  console.log(`\n2. Testing SignIn for ${testEmail}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.log('❌ SignIn error:', signInError.message);
  } else {
    console.log('✅ SignIn success! User ID:', signInData?.user?.id);
    console.log('✅ Access Token generated:', !!signInData?.session?.access_token);
  }

  // Test 3: Sign in with invalid password (must fail with error)
  console.log(`\n3. Testing SignIn with wrong password (should fail)...`);
  const { data: failData, error: failError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'WrongPassword!',
  });

  if (failError) {
    console.log('✅ Correctly rejected invalid password:', failError.message);
  } else {
    console.log('❌ Unexpectedly succeeded on invalid password');
  }
}

runAuthTest();

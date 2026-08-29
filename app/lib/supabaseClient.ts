import { createClient } from '@supabase/supabase-js';

// Supabase Client for VariRaksha
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://tbxlgbxlorsuiaoedrns.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGxnYnhsb3JzdWlhb2Vkcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQ1ODEsImV4cCI6MjEwMzUzMDU4MX0.9uh937pOvoGSUXxNAt-shs_gZUmNt1ILlkQlsqpzv8E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

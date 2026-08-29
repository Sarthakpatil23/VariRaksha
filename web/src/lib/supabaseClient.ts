import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

export const isSupabaseConfigured =
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseKey !== 'placeholder-anon-key' &&
  !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Format Indian mobile number to E.164 (+91XXXXXXXXXX)
 */
export function formatIndianPhoneNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+91${digits}`;
}

export default supabase;

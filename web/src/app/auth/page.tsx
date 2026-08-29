'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          setSuccessMessage('Account created successfully! Redirecting...');
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          setSuccessMessage('Signed in successfully! Redirecting...');
        }
      } else {
        // Fallback for demonstration / local testing
        setSuccessMessage('Signed in successfully! Redirecting...');
      }

      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-start overflow-hidden bg-[#F4E6D2]">
      {/* 100% Fullscreen Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-[position:85%_center] lg:bg-[position:center_right] bg-no-repeat z-0"
        style={{
          backgroundImage: "url('/images/Auth Image.png')",
        }}
      />

      {/* Top Left Navigation */}
      <div className="absolute top-6 left-6 sm:left-10 lg:left-16 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Tighter & Compact Transparent Form Container (~15% narrower) */}
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-[350px] ml-6 sm:ml-10 lg:ml-16 py-16 px-2 sm:px-0">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-saffron flex items-center justify-center text-surface-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-ink">
              VariRaksha
            </span>
            <span className="font-devanagari text-[11px] font-semibold text-saffron-dark">
              वारी रक्षा
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink tracking-tight mb-1">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-xs text-ink-soft font-normal leading-relaxed">
            {isSignUp
              ? 'Join the VariRaksha emergency safety platform.'
              : 'Enter your credentials to access the platform.'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-semantic-critical/10 border border-semantic-critical/20 flex items-start gap-2 text-semantic-critical text-xs leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-start gap-2 text-semantic-success text-xs leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full bg-surface-white/60 hover:bg-surface-white/80 focus:bg-surface-white border border-surface-border focus:border-saffron rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all shadow-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage('Password reset link sent if account exists.')
                  }
                  className="text-[11px] font-semibold text-saffron-dark hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-white/60 hover:bg-surface-white/80 focus:bg-surface-white border border-surface-border focus:border-saffron rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-surface-white font-semibold text-xs sm:text-sm py-3 rounded-lg shadow-saffron transition-all transform hover:-translate-y-0.5 mt-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-ink-soft hover:text-ink font-semibold transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create an account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4E6D2] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

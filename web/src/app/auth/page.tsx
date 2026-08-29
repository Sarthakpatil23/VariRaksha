'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRateLimited(false);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split('@')[0],
              role: 'coordinator',
            },
          },
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMessage('Account created and signed in! Redirecting...');
          setTimeout(() => {
            router.push(redirectTo);
          }, 800);
        } else if (data?.user && !data?.session) {
          setSuccessMessage(
            'Account created! A confirmation email has been sent. Please check your inbox or sign in if email confirmation is disabled.'
          );
        }
      } else {
        // Sign In with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMessage('Signed in successfully! Redirecting...');
          setTimeout(() => {
            router.push(redirectTo);
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('Supabase auth error:', err);

      let msg = err?.message || 'Authentication failed. Please check your details.';
      if (msg.toLowerCase().includes('rate limit') || err?.status === 429) {
        setIsRateLimited(true);
        msg =
          'Supabase email rate limit exceeded (Free-tier limits email sends to 3-4/hr). To fix: In your Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF "Confirm email".';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password. If you do not have an account, click "Create an account" below.';
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Email not confirmed yet. Click the link in your email, or turn OFF "Confirm email" in Supabase Dashboard -> Auth -> Providers.';
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address first, then click "Forgot?".');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      setSuccessMessage('Password reset link has been sent to your email address.');
    } catch (err: any) {
      if (err?.message?.toLowerCase()?.includes('rate limit')) {
        setIsRateLimited(true);
        setErrorMessage('Email rate limit reached on Supabase. Turn off email confirmation in dashboard.');
      } else {
        setErrorMessage(err?.message || 'Failed to send reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant Demo Bypass for immediate testing when rate-limited
  const handleDemoBypass = () => {
    setSuccessMessage('Demo access granted! Redirecting...');
    setTimeout(() => {
      router.push(redirectTo);
    }, 600);
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

      {/* Compact Transparent Left-Aligned Form */}
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-[350px] ml-6 sm:ml-10 lg:ml-16 py-16 px-2 sm:px-0">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <Image
              src="/logo.png"
              alt="VariRaksha Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
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

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-lg bg-semantic-critical/15 border border-semantic-critical/30 text-semantic-critical text-xs leading-relaxed animate-in fade-in">
            <div className="flex items-start gap-2 mb-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>

            {/* Quick Demo Bypass button if rate limited */}
            {isRateLimited && (
              <button
                type="button"
                onClick={handleDemoBypass}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-semantic-critical/20 hover:bg-semantic-critical/30 text-ink font-bold text-[11px] transition-colors"
              >
                <Sparkles className="w-3 h-3 text-saffron" />
                <span>Continue in Demo Mode (Skip Cooldown)</span>
              </button>
            )}
          </div>
        )}

        {/* Success Alert Message */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-semantic-success/15 border border-semantic-success/30 flex items-start gap-2 text-semantic-success text-xs leading-relaxed animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Santosh Patil"
                className="w-full bg-surface-white/60 hover:bg-surface-white/80 focus:bg-surface-white border border-surface-border focus:border-saffron rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
                  onClick={handleForgotPassword}
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
                <span>{isSignUp ? 'Creating account...' : 'Authenticating...'}</span>
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
                setIsRateLimited(false);
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

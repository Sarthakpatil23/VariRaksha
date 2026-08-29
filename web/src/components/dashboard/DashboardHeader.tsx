'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Admin Dashboard',
  subtitle = 'Pilgrimage Route Management',
  backHref,
  backLabel = 'Back to Overview',
}) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md border-b border-surface-border/80 px-6 sm:px-10 lg:px-16 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <Image
                src="/logo.png"
                alt="VariRaksha Logo"
                width={32}
                height={32}
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
          </Link>

          <span className="hidden sm:inline-block text-surface-border font-light">|</span>

          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-parchment-light border border-surface-border text-[11px] font-bold uppercase tracking-wider text-saffron-dark">
                <Layers className="w-3 h-3" />
                <span>Admin Operations</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-ink">System Administrator</span>
            <span className="text-[10px] font-medium text-muted">Admin Control Room</span>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-white hover:bg-parchment-light border border-surface-border text-xs font-semibold text-ink transition-all shadow-sm"
            title="Sign out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5 text-muted" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

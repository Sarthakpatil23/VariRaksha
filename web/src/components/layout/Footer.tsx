import React from 'react';
import Image from 'next/image';
import { Heart, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-parchment-light pt-20 pb-12 border-t border-surface-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-surface-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-surface-white/10 p-0.5">
                <Image
                  src="/logo.png"
                  alt="VariRaksha Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-xl tracking-tight text-surface-white">
                  VariRaksha
                </span>
                <span className="font-devanagari text-xs font-semibold text-saffron">
                  वारी रक्षा
                </span>
              </div>
            </div>

            <p className="text-sm text-parchment/70 max-w-sm leading-relaxed">
              A mission-critical public safety ecosystem connecting pilgrims,
              Dindi leaders, coordinators, medical staff, and families across the
              Pandharpur Wari.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-medium text-parchment/60 pt-2">
              <span>Protection that reaches you, even offline.</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-saffron">
              Platform Surfaces
            </div>
            <ul className="space-y-2 text-sm text-parchment/70">
              <li>
                <a href="#how-it-works" className="hover:text-surface-white transition-colors">
                  Mobile Application
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-surface-white transition-colors">
                  Web Command Center
                </a>
              </li>
              <li>
                <a href="#qr-medical" className="hover:text-surface-white transition-colors">
                  Public Emergency Card (/p/[id])
                </a>
              </li>
              <li>
                <a href="#emergency-flow" className="hover:text-surface-white transition-colors">
                  Live SOS Dispatch
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-saffron">
              Core Architecture
            </div>
            <ul className="space-y-2 text-sm text-parchment/70">
              <li>
                <a href="#offline" className="hover:text-surface-white transition-colors">
                  Offline SQLite Caching
                </a>
              </li>
              <li>
                <a href="#offline" className="hover:text-surface-white transition-colors">
                  Simulated BLE Mesh Relay
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-surface-white transition-colors">
                  Supabase Realtime Sync
                </a>
              </li>
              <li>
                <a href="#qr-medical" className="hover:text-surface-white transition-colors">
                  Universal HTTPS Links
                </a>
              </li>
            </ul>
          </div>

          {/* Ecosystem Roles */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-saffron">
              Stakeholders
            </div>
            <ul className="space-y-2 text-sm text-parchment/70">
              <li>
                <a href="#roles" className="hover:text-surface-white transition-colors">
                  Varkari (Pilgrim)
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-surface-white transition-colors">
                  Dindi Leader
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-surface-white transition-colors">
                  Coordinator & Volunteer
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-surface-white transition-colors">
                  Medical Responders
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-surface-white transition-colors">
                  Emergency Contacts
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-parchment/50">
          <div className="flex items-center gap-1">
            <span>Built with dedication for the Pandharpur Wari</span>
            <Heart className="w-3.5 h-3.5 text-saffron fill-saffron mx-1" />
            <span>• Hackathon Edition</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Next.js • React Native • Supabase</span>
            <a
              href="#"
              className="p-1.5 rounded-lg bg-surface-white/10 hover:bg-surface-white/20 text-surface-white transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

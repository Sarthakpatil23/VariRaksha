'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Platform', href: '#platform' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Emergency Flow', href: '#emergency-flow' },
    { name: 'Roles', href: '#roles' },
    { name: 'QR & Medical ID', href: '#qr-medical' },
    { name: 'Offline Sync', href: '#offline' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-parchment/90 backdrop-blur-md border-b border-surface-border/60 py-4 shadow-sm'
          : 'bg-transparent py-5 md:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-9 h-9 rounded-xl bg-saffron flex items-center justify-center text-surface-white shadow-saffron group-hover:bg-saffron-dark transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-ink">
                VariRaksha
              </span>
              <span className="font-devanagari text-sm font-semibold text-saffron tracking-normal">
                वारी रक्षा
              </span>
            </div>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-muted -mt-0.5">
              Public Safety Ecosystem
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-ink-soft">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-saffron transition-colors relative py-1 focus:outline-none focus:text-saffron"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#qr-medical"
            className="text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-ink px-3 py-2 transition-colors"
          >
            Emergency QR
          </a>
          <a
            href="#platform"
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-surface-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-card transition-all transform hover:-translate-y-0.5"
          >
            <span>Open VariRaksha</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-ink hover:text-saffron focus:outline-none rounded-lg"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-parchment-light border-b border-surface-border px-6 py-6 shadow-elevated animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-ink hover:text-saffron py-1 border-b border-surface-border/40"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 bg-saffron text-surface-white font-semibold py-3 px-4 rounded-xl text-center shadow-card"
              >
                <span>Open VariRaksha</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

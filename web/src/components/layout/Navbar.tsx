'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Emergency Flow', href: '#emergency-flow' },
    { name: 'Roles', href: '#roles' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-parchment/95 backdrop-blur-md border-b border-surface-border py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">

        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-3 focus:outline-none group">
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
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xl tracking-tight text-ink group-hover:text-saffron transition-colors">
              VariRaksha
            </span>
            <span className="font-devanagari text-sm text-saffron font-semibold leading-none">
              वारी रक्षा
            </span>
          </div>
        </Link>

        {/* Desktop nav — 3 links max */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Single CTA */}
        <div className="hidden md:block">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-surface-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-saffron"
          >
            Open VariRaksha
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-ink hover:text-saffron focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-parchment border-b border-surface-border px-6 py-5">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-ink-soft hover:text-ink py-2.5 border-b border-surface-border/50 last:border-0 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 bg-saffron text-surface-white font-semibold py-3 px-4 rounded-xl mt-3 text-sm"
            >
              Open VariRaksha
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

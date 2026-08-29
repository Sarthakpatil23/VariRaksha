'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, User, ArrowRight, Edit3, Trash2, Calendar, Shield } from 'lucide-react';
import { Vari } from '@/types/vari';

interface VariCardProps {
  vari: Vari;
  onEdit: (vari: Vari) => void;
  onDelete: (vari: Vari) => void;
}

export const VariCard: React.FC<VariCardProps> = ({ vari, onEdit, onDelete }) => {
  const formattedDate = new Date(vari.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-surface-white border border-surface-border hover:border-saffron/60 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-elevated transition-all flex flex-col justify-between">
      {/* Top Details & Route Header */}
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-surface-border text-xs font-bold uppercase tracking-wider text-saffron-dark font-sans">
            <Shield className="w-3 h-3" />
            <span>{vari.vari_number}</span>
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vari);
              }}
              className="p-1.5 rounded-lg hover:bg-parchment text-muted hover:text-ink transition-colors"
              title="Edit Vari Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vari);
              }}
              className="p-1.5 rounded-lg hover:bg-semantic-critical/10 text-muted hover:text-semantic-critical transition-colors"
              title="Delete Vari"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Major Pilgrimage Route */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-ink tracking-tight">
            <span>{vari.start_point}</span>
            <span className="text-saffron">→</span>
            <span>{vari.destination}</span>
          </div>
          <div className="text-[11px] text-muted font-medium mt-0.5">
            {vari.start_point === 'Dehu'
              ? 'Sant Tukaram Maharaj Palkhi Marg'
              : 'Sant Dnyaneshwar Maharaj Palkhi Marg'}
          </div>
        </div>

        {/* Dindi Leader */}
        <div className="flex items-center gap-2 text-xs font-medium text-ink-soft py-2 px-3 rounded-xl bg-parchment-light/60 border border-surface-border/60 mb-5">
          <User className="w-3.5 h-3.5 text-saffron shrink-0" />
          <span className="text-muted">Leader:</span>
          <span className="font-bold text-ink truncate">{vari.dindi_leader_name}</span>
        </div>
      </div>

      {/* Footer & Workspace Link */}
      <div className="pt-4 border-t border-surface-border/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>

        <Link
          href={`/dashboard/vari/${vari.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron hover:text-saffron-dark group-hover:translate-x-0.5 transition-all"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

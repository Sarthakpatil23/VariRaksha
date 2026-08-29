'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Edit3, Trash2, Calendar } from 'lucide-react';
import { Vari } from '@/types/vari';

interface VariCardProps {
  vari: Vari;
  onEdit: (vari: Vari) => void;
  onDelete: (vari: Vari) => void;
}

const getPalkhiMargName = (startPoint: string) => {
  switch (startPoint) {
    case 'Dehu':
      return 'Sant Tukaram Maharaj Palkhi Marg';
    case 'Alandi':
      return 'Sant Dnyaneshwar Maharaj Palkhi Marg';
    case 'Paithan':
      return 'Sant Eknath Maharaj Palkhi Marg';
    case 'Trimbakeshwar':
      return 'Sant Nivruttinath Maharaj Palkhi Marg';
    case 'Shegaon':
      return 'Sant Gajanan Maharaj Palkhi Marg';
    case 'Sajjangad':
      return 'Samarth Ramdas Swami Palkhi Marg';
    case 'Saswad':
      return 'Sant Sopandev Maharaj Palkhi Marg';
    case 'Murtijapur':
      return 'Sant Gadge Maharaj Palkhi Marg';
    default:
      return `${startPoint} Palkhi Marg`;
  }
};

export const VariCard: React.FC<VariCardProps> = ({ vari, onEdit, onDelete }) => {
  const formattedDate = new Date(vari.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-surface-white border border-surface-border hover:border-saffron/70 rounded-[10px] p-6 shadow-[0_1px_2px_rgba(23,34,56,0.04)] transition-all flex flex-col justify-between">
      {/* Top Details & Route Header */}
      <div>
        {/* Top Identifier & Actions Row */}
        <div className="flex items-center justify-between mb-2">
          {/* Plain Saffron small-caps label, no border/background */}
          <span className="text-xs font-bold uppercase tracking-widest text-saffron font-sans">
            {vari.vari_number}
          </span>

          {/* Edit / Delete Icon Buttons (subtle hover, no background pill) */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vari);
              }}
              className="p-1 text-muted hover:text-ink transition-colors focus:outline-none"
              title="Edit Vari Details"
              aria-label="Edit Vari"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vari);
              }}
              className="p-1 text-muted hover:text-semantic-critical transition-colors focus:outline-none"
              title="Delete Vari"
              aria-label="Delete Vari"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Major Pilgrimage Route */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-ink tracking-tight">
            <span>{vari.start_point}</span>
            <span className="text-saffron/80 font-normal">→</span>
            <span>{vari.destination}</span>
          </div>
          <div className="text-xs text-muted font-normal mt-0.5">
            {getPalkhiMargName(vari.start_point)}
          </div>
        </div>

        {/* Dindi Leader (Plain inline text, no background box) */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted shrink-0">
            Leader
          </span>
          <span className="text-sm font-semibold text-ink truncate">
            {vari.dindi_leader_name}
          </span>
        </div>
      </div>

      {/* Single Hairline Divider & Footer Row */}
      <div className="pt-4 border-t border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{formattedDate}</span>
        </div>

        <Link
          href={`/dashboard/vari/${vari.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron hover:text-saffron-dark group-hover:translate-x-0.5 transition-all"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
};

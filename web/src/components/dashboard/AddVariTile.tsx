'use client';

import React from 'react';
import { Plus, Compass, Sparkles } from 'lucide-react';

interface AddVariTileProps {
  isInitialEmpty?: boolean;
  onClick: () => void;
}

export const AddVariTile: React.FC<AddVariTileProps> = ({
  isInitialEmpty = false,
  onClick,
}) => {
  if (isInitialEmpty) {
    return (
      <div className="max-w-2xl mx-auto my-12">
        <button
          onClick={onClick}
          className="group w-full text-left bg-surface-white/60 hover:bg-surface-white border-2 border-dashed border-surface-border hover:border-saffron rounded-3xl p-10 sm:p-14 transition-all shadow-sm hover:shadow-elevated flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-saffron/40"
        >
          {/* Big Plus Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-parchment-light border border-surface-border group-hover:border-saffron group-hover:bg-saffron text-saffron group-hover:text-surface-white flex items-center justify-center mb-6 shadow-sm transition-all transform group-hover:scale-105">
            <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-3">
            Add a new Vari
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-ink-soft max-w-md mb-8 leading-relaxed">
            Create a pilgrimage route instance starting from{' '}
            <strong className="text-ink">Dehu</strong> or{' '}
            <strong className="text-ink">Alandi</strong> leading to{' '}
            <strong className="text-saffron-dark">Pandharpur</strong>.
          </p>

          {/* Action Prompt */}
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-saffron text-surface-white text-xs font-bold uppercase tracking-wider shadow-saffron transition-all group-hover:bg-saffron-dark">
            <Compass className="w-4 h-4" />
            <span>Create First Vari Instance</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group min-h-[260px] bg-parchment-light/40 hover:bg-surface-white border-2 border-dashed border-surface-border hover:border-saffron rounded-2xl p-6 sm:p-7 transition-all shadow-sm hover:shadow-card flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-saffron/40"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-white border border-surface-border group-hover:border-saffron group-hover:bg-saffron text-saffron group-hover:text-surface-white flex items-center justify-center mb-4 transition-all transform group-hover:scale-105 shadow-xs">
        <Plus className="w-6 h-6" />
      </div>

      <span className="text-base font-extrabold text-ink tracking-tight mb-1">
        Add another Vari
      </span>

      <span className="text-xs text-muted max-w-[200px]">
        Register a new Palkhi pilgrimage column
      </span>
    </button>
  );
};

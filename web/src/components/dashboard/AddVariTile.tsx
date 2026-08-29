'use client';

import React from 'react';
import { Plus, Compass } from 'lucide-react';

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
          className="group w-full text-left bg-surface-white hover:bg-parchment-light/30 border border-dashed border-surface-border hover:border-saffron rounded-[10px] p-8 sm:p-12 transition-all shadow-[0_1px_2px_rgba(23,34,56,0.04)] flex flex-col items-center justify-center text-center focus:outline-none focus:ring-1 focus:ring-saffron"
        >
          {/* Plain Saffron Plus Icon without circular background */}
          <Plus className="w-10 h-10 text-saffron mb-4 transition-transform group-hover:scale-110" strokeWidth={1.5} />

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mb-2">
            Add a new Vari
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-ink-soft max-w-md mb-6 leading-relaxed">
            Create a pilgrimage route instance starting from{' '}
            <strong className="text-ink font-semibold">Dehu</strong>,{' '}
            <strong className="text-ink font-semibold">Alandi</strong>, or other sacred origins leading to{' '}
            <strong className="text-saffron-dark font-semibold">Pandharpur</strong>.
          </p>

          {/* Action Prompt */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-saffron text-surface-white text-xs font-bold uppercase tracking-wider transition-all group-hover:bg-saffron-dark shadow-saffron">
            <Compass className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Create First Vari Instance</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group min-h-[220px] bg-parchment-light/30 hover:bg-surface-white border border-dashed border-surface-border hover:border-saffron rounded-[10px] p-6 transition-all shadow-[0_1px_2px_rgba(23,34,56,0.04)] flex flex-col items-center justify-center text-center focus:outline-none focus:ring-1 focus:ring-saffron"
    >
      {/* Plain Saffron Plus Icon directly on the card */}
      <Plus className="w-7 h-7 text-saffron mb-3 transition-transform group-hover:scale-110" strokeWidth={1.5} />

      <span className="text-sm font-bold text-ink tracking-tight mb-1">
        Add another Vari
      </span>

      <span className="text-xs text-muted max-w-[200px]">
        Register a new Palkhi pilgrimage column
      </span>
    </button>
  );
};

'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { ActorRecord, SheetTab } from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

interface DeleteActorModalProps {
  isOpen: boolean;
  activeTab: SheetTab;
  record: ActorRecord | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export const DeleteActorModal: React.FC<DeleteActorModalProps> = ({
  isOpen,
  activeTab,
  record,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const roleNameMap: Record<SheetTab, string> = {
    varkari: 'Varkari Pilgrim',
    volunteer: 'Volunteer',
    medical_staff: 'Medical Staff',
  };

  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage(null);

    const tableMap: Record<SheetTab, string> = {
      varkari: 'vari_varkaris',
      volunteer: 'vari_volunteers',
      medical_staff: 'vari_medical_staff',
    };

    try {
      const { error } = await supabase
        .from(tableMap[activeTab])
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      onSuccess(record.id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      setErrorMessage(err?.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-elevated">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border/60">
          <div className="flex items-center gap-3 text-semantic-critical">
            <div className="w-10 h-10 rounded-xl bg-semantic-critical/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-ink tracking-tight">
              Delete {roleNameMap[activeTab]}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-parchment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-ink-soft leading-relaxed mb-4">
          Are you sure you want to remove{' '}
          <strong className="text-ink font-bold">{record.full_name}</strong> from this Vari sheet?
        </p>

        {errorMessage && (
          <div className="mb-4 text-xs text-semantic-critical font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-border hover:bg-parchment text-xs font-bold text-ink"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 bg-semantic-critical hover:bg-red-700 text-surface-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

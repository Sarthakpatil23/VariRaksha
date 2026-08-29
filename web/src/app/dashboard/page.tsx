'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  AlertCircle,
  Compass,
  Crown,
  Shield,
  MapPin,
  Users,
  Search,
  Phone,
  Eye,
  Edit3,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { VariCard } from '@/components/dashboard/VariCard';
import { AddVariTile } from '@/components/dashboard/AddVariTile';
import { VariFormModal } from '@/components/dashboard/VariFormModal';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';
import { DindiLeaderModal } from '@/components/dashboard/DindiLeaderModal';
import { Vari, DindiLeaderProfile, EmergencyContact } from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();

  // Active Main Section View: 'varis' or 'leaders'
  const [dashboardView, setDashboardView] = useState<'varis' | 'leaders'>('varis');

  // Datasets
  const [varis, setVaris] = useState<Vari[]>([]);
  const [leaders, setLeaders] = useState<DindiLeaderProfile[]>([]);
  const [varkariCounts, setVarkariCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search in Leader Directory
  const [leaderSearchQuery, setLeaderSearchQuery] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingVari, setEditingVari] = useState<Vari | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingVari, setDeletingVari] = useState<Vari | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<DindiLeaderProfile | null>(null);
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);

  // Fetch all Varis, Leaders, and Dynamic Varkari Counts
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth?redirect=/dashboard');
        return;
      }

      // Parallel Fetch: Varis, Leaders, Varkari records, and Emergency Contacts
      const [varisRes, leadersRes, varkarisRes, contactsRes] = await Promise.all([
        supabase.from('vari').select('*').order('created_at', { ascending: false }),
        supabase.from('vari_dindi_malaks').select('*').order('created_at', { ascending: false }),
        supabase.from('vari_varkaris').select('id, vari_id'),
        supabase.from('vari_actor_emergency_contacts').select('*').eq('actor_type', 'dindi_malak'),
      ]);

      if (varisRes.error) throw varisRes.error;

      const loadedVaris = (varisRes.data as Vari[]) || [];
      const loadedLeaders = (leadersRes.data as DindiLeaderProfile[]) || [];
      const loadedVarkaris = varkarisRes.data || [];
      const loadedContacts = (contactsRes.data as EmergencyContact[]) || [];

      // Calculate dynamic Varkari count per Vari
      const countsMap: Record<string, number> = {};
      loadedVarkaris.forEach((v: any) => {
        countsMap[v.vari_id] = (countsMap[v.vari_id] || 0) + 1;
      });
      setVarkariCounts(countsMap);

      // Map associated Vari and Emergency Contacts to each Leader profile
      const mappedLeaders = loadedLeaders.map((leader) => {
        const associatedVari = loadedVaris.find((v) => v.id === leader.vari_id);
        const contacts = loadedContacts.filter((c) => c.actor_id === leader.id);
        const count = countsMap[leader.vari_id] || 0;

        return {
          ...leader,
          vari: associatedVari,
          emergency_contacts: contacts,
          varkari_count: count,
        };
      });

      setVaris(loadedVaris);
      setLeaders(mappedLeaders);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setErrorMessage(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Vari Create / Edit Success
  const handleFormSuccess = (
    savedVari: Vari,
    savedLeader?: DindiLeaderProfile,
    isEdit?: boolean
  ) => {
    if (isEdit) {
      setVaris((prev) => prev.map((v) => (v.id === savedVari.id ? savedVari : v)));
      if (savedLeader) {
        setLeaders((prev) =>
          prev.map((l) => (l.vari_id === savedVari.id ? { ...savedLeader, vari: savedVari } : l))
        );
      }
    } else {
      setVaris((prev) => [savedVari, ...prev]);
      if (savedLeader) {
        setLeaders((prev) => [{ ...savedLeader, vari: savedVari, varkari_count: 0 }, ...prev]);
      }
    }
  };

  // Handle Delete Success
  const handleDeleteSuccess = (deletedId: string) => {
    setVaris((prev) => prev.filter((v) => v.id !== deletedId));
    setLeaders((prev) => prev.filter((l) => l.vari_id !== deletedId));
  };

  // Handle Leader Update from Profile Modal
  const handleLeaderUpdateSuccess = (updatedLeader: DindiLeaderProfile) => {
    setLeaders((prev) => prev.map((l) => (l.id === updatedLeader.id ? updatedLeader : l)));
    // Also update leader name in vari state
    setVaris((prev) =>
      prev.map((v) =>
        v.id === updatedLeader.vari_id ? { ...v, dindi_leader_name: updatedLeader.full_name } : v
      )
    );
  };

  const existingVariNumbers = varis.map((v) => v.vari_number);

  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-saffron selection:text-surface-white">
      {/* Top Admin Navigation Header */}
      <DashboardHeader />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-14 w-full flex-1">
        {/* Section Header & Top View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pb-6 border-b border-surface-border/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-parchment-light border border-surface-border text-saffron text-[11px] font-bold uppercase tracking-widest mb-3 shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              <span>Pandharpur Pilgrimage Control</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              {dashboardView === 'varis' ? 'Pilgrimage Varis & Routes' : 'Dindi Leaders Directory'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-xl">
              {dashboardView === 'varis'
                ? 'Create, configure, and manage pilgrimage route instances from Dehu and Alandi to Pandharpur.'
                : '1-to-1 Dindi Leader profiles, emergency contacts, and live pilgrim counts.'}
            </p>
          </div>

          {/* Section Switcher Tabs & Refresh */}
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-parchment-light border border-surface-border flex items-center shadow-xs">
              <button
                onClick={() => setDashboardView('varis')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dashboardView === 'varis'
                    ? 'bg-surface-white text-ink shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Active Varis ({varis.length})</span>
              </button>

              <button
                onClick={() => setDashboardView('leaders')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dashboardView === 'leaders'
                    ? 'bg-surface-white text-ink shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Dindi Leaders ({leaders.length})</span>
              </button>
            </div>

            <button
              onClick={fetchDashboardData}
              className="p-2 rounded-xl bg-surface-white hover:bg-parchment-light border border-surface-border text-muted hover:text-ink transition-colors shadow-xs"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-semantic-critical/10 border border-semantic-critical/20 flex items-start justify-between gap-4 text-semantic-critical text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="font-bold underline uppercase tracking-wider text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* VIEW 1: ACTIVE VARIS LIST & CREATE TILE */}
        {dashboardView === 'varis' && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl bg-parchment-light/70 border border-surface-border p-6"
                />
              ))}
            </div>
          ) : varis.length === 0 ? (
            /* INITIAL EMPTY STATE */
            <AddVariTile
              isInitialEmpty={true}
              onClick={() => {
                setEditingVari(null);
                setFormModalOpen(true);
              }}
            />
          ) : (
            /* POPULATED STATE GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {varis.map((vari) => (
                <VariCard
                  key={vari.id}
                  vari={vari}
                  onEdit={(v) => {
                    setEditingVari(v);
                    setFormModalOpen(true);
                  }}
                  onDelete={(v) => {
                    setDeletingVari(v);
                    setDeleteModalOpen(true);
                  }}
                />
              ))}

              {/* Add Another Vari Tile in the Grid */}
              <AddVariTile
                isInitialEmpty={false}
                onClick={() => {
                  setEditingVari(null);
                  setFormModalOpen(true);
                }}
              />
            </div>
          )
        )}

        {/* VIEW 2: GLOBAL DINDI LEADERS DIRECTORY TABLE */}
        {dashboardView === 'leaders' && (
          <div className="bg-surface-white border border-surface-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Directory Toolbar */}
            <div className="p-4 sm:p-5 border-b border-surface-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-white">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={leaderSearchQuery}
                  onChange={(e) => setLeaderSearchQuery(e.target.value)}
                  placeholder="Search by leader name, village, or Vari..."
                  className="w-full bg-parchment-light/50 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                />
              </div>

              <div className="text-xs text-muted font-medium flex items-center gap-1.5 self-end sm:self-auto">
                <span>Total Registered Leaders:</span>
                <strong className="text-ink font-mono">{leaders.length}</strong>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto min-h-[350px]">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-muted">
                  <RefreshCw className="w-7 h-7 animate-spin text-saffron mb-3" />
                  <span className="text-xs font-semibold">Loading Dindi Leaders...</span>
                </div>
              ) : leaders.length === 0 ? (
                <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-parchment-light border border-surface-border text-saffron flex items-center justify-center mb-4 shadow-2xs">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-ink tracking-tight mb-1">
                    No Dindi Leaders registered yet
                  </h3>
                  <p className="text-xs text-muted max-w-sm mb-6">
                    Dindi Leaders are automatically created when you register a Vari pilgrimage route instance.
                  </p>
                  <button
                    onClick={() => {
                      setDashboardView('varis');
                      setFormModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-saffron"
                  >
                    <span>Create First Vari & Leader</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-parchment-light/80 text-muted font-bold uppercase tracking-wider border-b border-surface-border sticky top-0">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Leader Full Name</th>
                      <th className="py-3.5 px-4">Assigned Vari & Route</th>
                      <th className="py-3.5 px-4">Mobile Number</th>
                      <th className="py-3.5 px-4">Home Village / Town</th>
                      <th className="py-3.5 px-4">Varkari Count</th>
                      <th className="py-3.5 px-4">Emergency Contacts</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50 text-ink font-medium">
                    {leaders
                      .filter(
                        (l) =>
                          l.full_name.toLowerCase().includes(leaderSearchQuery.toLowerCase()) ||
                          l.village.toLowerCase().includes(leaderSearchQuery.toLowerCase()) ||
                          (l.vari?.vari_number || '').toLowerCase().includes(leaderSearchQuery.toLowerCase())
                      )
                      .map((leader) => (
                        <tr
                          key={leader.id}
                          className="hover:bg-parchment-light/40 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedLeader(leader);
                            setLeaderModalOpen(true);
                          }}
                        >
                          <td className="py-4 px-4 sm:px-6 font-bold text-ink flex items-center gap-2">
                            <Crown className="w-3.5 h-3.5 text-saffron shrink-0" />
                            <span>{leader.full_name}</span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-saffron-dark">
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3 h-3" />
                              <span>{leader.vari?.vari_number || 'Vari'}</span>
                              <span className="text-muted text-[11px] font-normal">
                                ({leader.vari?.start_point} → {leader.vari?.destination})
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted font-mono">{leader.mobile_number}</td>
                          <td className="py-4 px-4 text-ink-soft">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-saffron shrink-0" />
                              <span>{leader.village}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-saffron/10 text-saffron-dark font-mono font-bold text-xs">
                              <span>{varkariCounts[leader.vari_id] || 0} Varkaris</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-muted">
                            {leader.emergency_contacts && leader.emergency_contacts.length > 0 ? (
                              <span className="text-[11px] font-semibold text-ink">
                                {leader.emergency_contacts.length} Contact{leader.emergency_contacts.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeader(leader);
                                setLeaderModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-parchment hover:bg-parchment-deep text-ink text-xs font-bold transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Profile</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Vari Create & Edit Modal with 1-to-1 Leader Profile input */}
      <VariFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingVari(null);
        }}
        onSuccess={handleFormSuccess}
        editingVari={editingVari}
        existingVariNumbers={existingVariNumbers}
      />

      {/* Delete Vari Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        vari={deletingVari}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingVari(null);
        }}
        onSuccess={handleDeleteSuccess}
      />

      {/* Dindi Leader Profile & Edit Modal */}
      <DindiLeaderModal
        isOpen={leaderModalOpen}
        leader={selectedLeader}
        onClose={() => {
          setLeaderModalOpen(false);
          setSelectedLeader(null);
        }}
        onSuccess={handleLeaderUpdateSuccess}
      />
    </div>
  );
}

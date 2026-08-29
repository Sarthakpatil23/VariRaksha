'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  HeartHandshake,
  Stethoscope,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Shield,
  MapPin,
  FileSpreadsheet,
  PhoneCall,
  Lock,
  Crown,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ActorFormModal } from '@/components/dashboard/ActorFormModal';
import { DeleteActorModal } from '@/components/dashboard/DeleteActorModal';
import {
  Vari,
  SheetTab,
  VarkariRecord,
  VolunteerRecord,
  MedicalStaffRecord,
  ActorRecord,
  EmergencyContact,
} from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

export default function VariWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const variId = params.id as string;

  // Vari Parent State
  const [vari, setVari] = useState<Vari | null>(null);
  const [loadingVari, setLoadingVari] = useState(true);

  // Active Sheet Tab (Strictly 3 tabs: Varkari, Volunteer, Medical Staff)
  const [activeTab, setActiveTab] = useState<SheetTab>('varkari');

  // Sheet Datasets
  const [varkaris, setVarkaris] = useState<VarkariRecord[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
  const [medicalStaff, setMedicalStaff] = useState<MedicalStaffRecord[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActorRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<ActorRecord | null>(null);

  // Fetch Parent Vari
  const fetchVari = useCallback(async () => {
    setLoadingVari(true);
    try {
      const { data, error } = await supabase
        .from('vari')
        .select('*')
        .eq('id', variId)
        .single();

      if (error) throw error;
      setVari(data as Vari);
    } catch (err: any) {
      console.error('Error loading Vari:', err);
      router.push('/dashboard');
    } finally {
      setLoadingVari(false);
    }
  }, [variId, router]);

  // Fetch All Scoped Sheet Datasets
  const fetchAllSheets = useCallback(async () => {
    if (!variId) return;
    setLoadingSheet(true);

    try {
      const [varkarisRes, volRes, medRes, contactsRes] = await Promise.all([
        supabase.from('vari_varkaris').select('*').eq('vari_id', variId).order('created_at', { ascending: false }),
        supabase.from('vari_volunteers').select('*').eq('vari_id', variId).order('created_at', { ascending: false }),
        supabase.from('vari_medical_staff').select('*').eq('vari_id', variId).order('created_at', { ascending: false }),
        supabase.from('vari_actor_emergency_contacts').select('*'),
      ]);

      const allContacts = (contactsRes.data as EmergencyContact[]) || [];

      const attachContacts = <T extends { id: string }>(actors: T[], type: SheetTab) =>
        actors.map((actor) => ({
          ...actor,
          emergency_contacts: allContacts.filter(
            (c) => c.actor_id === actor.id && c.actor_type === type
          ),
        }));

      if (varkarisRes.data) {
        setVarkaris(attachContacts(varkarisRes.data, 'varkari') as VarkariRecord[]);
      }
      if (volRes.data) {
        setVolunteers(attachContacts(volRes.data, 'volunteer') as VolunteerRecord[]);
      }
      if (medRes.data) {
        setMedicalStaff(attachContacts(medRes.data, 'medical_staff') as MedicalStaffRecord[]);
      }
    } catch (err) {
      console.error('Error fetching sheet datasets:', err);
    } finally {
      setLoadingSheet(false);
    }
  }, [variId]);

  useEffect(() => {
    fetchVari();
  }, [fetchVari]);

  useEffect(() => {
    fetchAllSheets();
  }, [fetchAllSheets]);

  // Derived Dindi Context
  const dindiNameMap: Record<string, string> = {
    Dehu: 'Sant Tukaram Maharaj Palkhi Dindi',
    Alandi: 'Sant Dnyaneshwar Maharaj Palkhi Dindi',
    Paithan: 'Sant Eknath Maharaj Palkhi Dindi',
    Trimbakeshwar: 'Sant Nivruttinath Maharaj Palkhi Dindi',
    Shegaon: 'Sant Gajanan Maharaj Palkhi Dindi',
    Sajjangad: 'Samarth Ramdas Swami Palkhi Dindi',
    Saswad: 'Sant Sopandev Maharaj Palkhi Dindi',
    Murtijapur: 'Sant Gadge Maharaj Palkhi Dindi',
  };
  const dindiName = vari ? dindiNameMap[vari.start_point] || `${vari.start_point} Palkhi Dindi` : 'Palkhi Dindi';
  const dindiNumber = vari?.vari_number || 'Vari 01';

  // Handle Form Success
  const handleFormSuccess = (savedRecord: ActorRecord, isEdit: boolean) => {
    if (activeTab === 'varkari') {
      const rec = savedRecord as VarkariRecord;
      setVarkaris((prev) => (isEdit ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev]));
    } else if (activeTab === 'volunteer') {
      const rec = savedRecord as VolunteerRecord;
      setVolunteers((prev) => (isEdit ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev]));
    } else if (activeTab === 'medical_staff') {
      const rec = savedRecord as MedicalStaffRecord;
      setMedicalStaff((prev) => (isEdit ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev]));
    }
  };

  // Handle Delete Success
  const handleDeleteSuccess = (deletedId: string) => {
    if (activeTab === 'varkari') setVarkaris((prev) => prev.filter((r) => r.id !== deletedId));
    if (activeTab === 'volunteer') setVolunteers((prev) => prev.filter((r) => r.id !== deletedId));
    if (activeTab === 'medical_staff') setMedicalStaff((prev) => prev.filter((r) => r.id !== deletedId));
  };

  // 3 Workspace Tabs (Dindi Leader moved to Global Admin Dashboard)
  const tabs = [
    { id: 'varkari' as SheetTab, label: 'Varkari', icon: Users, count: varkaris.length },
    { id: 'volunteer' as SheetTab, label: 'Volunteer', icon: HeartHandshake, count: volunteers.length },
    { id: 'medical_staff' as SheetTab, label: 'Medical Staff', icon: Stethoscope, count: medicalStaff.length },
  ];

  if (loadingVari || !vari) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col">
        <DashboardHeader backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col selection:bg-saffron selection:text-surface-white">
      {/* Top Header */}
      <DashboardHeader backHref="/dashboard" backLabel="All Varis" />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 w-full flex-1 flex flex-col">
        {/* Scoped Vari Context Card */}
        <div className="bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light border border-surface-border text-xs font-bold uppercase tracking-wider text-saffron-dark font-sans shadow-2xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{vari.vari_number}</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  Vari Management Workspace
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight flex items-center gap-3">
                <span>{vari.start_point}</span>
                <span className="text-saffron">→</span>
                <span>{vari.destination}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-ink-soft">
                <span className="flex items-center gap-1.5 font-bold text-ink">
                  <Crown className="w-4 h-4 text-saffron" />
                  <span>Dindi Leader: {vari.dindi_leader_name}</span>
                </span>
                <span className="text-surface-border hidden sm:inline">•</span>
                <span className="text-muted">
                  {vari.start_point === 'Dehu'
                    ? 'Sant Tukaram Maharaj Palkhi Marg'
                    : 'Sant Dnyaneshwar Maharaj Palkhi Marg'}
                </span>
              </div>
            </div>

            {/* Total Registered Counter */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-parchment-light/80 border border-surface-border flex items-center gap-4 shadow-2xs">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Total In Vari
                  </div>
                  <div className="text-2xl font-extrabold text-ink">
                    {varkaris.length + volunteers.length + medicalStaff.length + 1}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spreadsheet-Inspired Navigation & Table Container */}
        <div className="bg-surface-white border border-surface-border rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* Sheet Navigation Tabs Bar (3 Tabs) */}
          <div className="bg-parchment-light/60 border-b border-surface-border px-4 sm:px-6 pt-3 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery('');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-surface-white border-surface-border text-ink border-b-transparent -mb-px shadow-xs'
                        : 'border-transparent text-muted hover:text-ink hover:bg-surface-white/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-saffron' : 'text-muted'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-saffron/10 text-saffron-dark font-bold'
                          : 'bg-parchment text-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAllSheets}
              className="p-2 text-muted hover:text-ink transition-colors"
              title="Refresh Sheet Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSheet ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Sheet Toolbar */}
          <div className="p-4 sm:p-5 border-b border-surface-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-white">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${tabs.find((t) => t.id === activeTab)?.label} records...`}
                className="w-full bg-parchment-light/50 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
              />
            </div>

            <button
              onClick={() => {
                setEditingRecord(null);
                setFormModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add {tabs.find((t) => t.id === activeTab)?.label}</span>
            </button>
          </div>

          {/* Table View */}
          <div className="flex-1 overflow-x-auto min-h-[380px]">
            {loadingSheet ? (
              <div className="py-24 flex flex-col items-center justify-center text-muted">
                <RefreshCw className="w-7 h-7 animate-spin text-saffron mb-3" />
                <span className="text-xs font-semibold">Loading sheet records...</span>
              </div>
            ) : (
              <div className="w-full">
                {/* 1. VARKARI TABLE */}
                {activeTab === 'varkari' && (
                  varkaris.length === 0 ? (
                    <EmptySheetView
                      role="Varkari"
                      onAdd={() => {
                        setEditingRecord(null);
                        setFormModalOpen(true);
                      }}
                    />
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-parchment-light/80 text-muted font-bold uppercase tracking-wider border-b border-surface-border sticky top-0">
                        <tr>
                          <th className="py-3.5 px-4 sm:px-6">Full Name</th>
                          <th className="py-3.5 px-4">Mobile Number</th>
                          <th className="py-3.5 px-4">Medical Conditions</th>
                          <th className="py-3.5 px-4">Allergies</th>
                          <th className="py-3.5 px-4">Home Village / Town</th>
                          <th className="py-3.5 px-4">Dindi Ref</th>
                          <th className="py-3.5 px-4">Emergency Contact(s)</th>
                          <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50 text-ink font-medium">
                        {varkaris
                          .filter(
                            (r) =>
                              r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.village.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((row) => (
                            <tr key={row.id} className="hover:bg-parchment-light/40 transition-colors">
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-ink">{row.full_name}</td>
                              <td className="py-3.5 px-4 text-muted font-mono">{row.mobile_number}</td>
                              <td className="py-3.5 px-4">
                                <span className={row.medical_conditions !== 'None' ? 'text-semantic-critical font-semibold' : 'text-muted'}>
                                  {row.medical_conditions || 'None'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={row.allergies !== 'None' ? 'text-semantic-critical font-semibold' : 'text-muted'}>
                                  {row.allergies || 'None'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-ink-soft">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-saffron shrink-0" />
                                  <span>{row.village}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted">
                                  <Lock className="w-2.5 h-2.5 text-muted" />
                                  <span>{dindiNumber}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <EmergencyContactsCell contacts={row.emergency_contacts} />
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRecord(row);
                                      setFormModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-parchment"
                                    title="Edit record"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingRecord(row);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-semantic-critical rounded-lg hover:bg-semantic-critical/10"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )
                )}

                {/* 2. VOLUNTEER TABLE */}
                {activeTab === 'volunteer' && (
                  volunteers.length === 0 ? (
                    <EmptySheetView
                      role="Volunteer"
                      onAdd={() => {
                        setEditingRecord(null);
                        setFormModalOpen(true);
                      }}
                    />
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-parchment-light/80 text-muted font-bold uppercase tracking-wider border-b border-surface-border sticky top-0">
                        <tr>
                          <th className="py-3.5 px-4 sm:px-6">Full Name</th>
                          <th className="py-3.5 px-4">Mobile Number</th>
                          <th className="py-3.5 px-4">Medical Conditions</th>
                          <th className="py-3.5 px-4">Allergies</th>
                          <th className="py-3.5 px-4">Village / Place</th>
                          <th className="py-3.5 px-4">Dindi Context</th>
                          <th className="py-3.5 px-4">Emergency Contact(s)</th>
                          <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50 text-ink font-medium">
                        {volunteers
                          .filter(
                            (r) =>
                              r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.village.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((row) => (
                            <tr key={row.id} className="hover:bg-parchment-light/40 transition-colors">
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-ink">{row.full_name}</td>
                              <td className="py-3.5 px-4 text-muted font-mono">{row.mobile_number}</td>
                              <td className="py-3.5 px-4 text-muted">{row.medical_conditions || 'None'}</td>
                              <td className="py-3.5 px-4 text-muted">{row.allergies || 'None'}</td>
                              <td className="py-3.5 px-4 text-ink-soft">{row.village}</td>
                              <td className="py-3.5 px-4 font-medium text-saffron-dark">
                                {dindiName} ({dindiNumber})
                              </td>
                              <td className="py-3.5 px-4">
                                <EmergencyContactsCell contacts={row.emergency_contacts} />
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRecord(row);
                                      setFormModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-parchment"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingRecord(row);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-semantic-critical rounded-lg hover:bg-semantic-critical/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )
                )}

                {/* 3. MEDICAL STAFF TABLE */}
                {activeTab === 'medical_staff' && (
                  medicalStaff.length === 0 ? (
                    <EmptySheetView
                      role="Medical Staff"
                      onAdd={() => {
                        setEditingRecord(null);
                        setFormModalOpen(true);
                      }}
                    />
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-parchment-light/80 text-muted font-bold uppercase tracking-wider border-b border-surface-border sticky top-0">
                        <tr>
                          <th className="py-3.5 px-4 sm:px-6">Full Name</th>
                          <th className="py-3.5 px-4">Mobile Number</th>
                          <th className="py-3.5 px-4">Medical Specialization</th>
                          <th className="py-3.5 px-4">Medical Conditions</th>
                          <th className="py-3.5 px-4">Allergies</th>
                          <th className="py-3.5 px-4">Village / Place</th>
                          <th className="py-3.5 px-4">Dindi Context</th>
                          <th className="py-3.5 px-4">Emergency Contact(s)</th>
                          <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50 text-ink font-medium">
                        {medicalStaff
                          .filter(
                            (r) =>
                              r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.specialization.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((row) => (
                            <tr key={row.id} className="hover:bg-parchment-light/40 transition-colors">
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-ink">{row.full_name}</td>
                              <td className="py-3.5 px-4 text-muted font-mono">{row.mobile_number}</td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-semantic-critical/10 text-semantic-critical font-bold text-xs">
                                  <Stethoscope className="w-3 h-3" />
                                  <span>{row.specialization}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-muted">{row.medical_conditions || 'None'}</td>
                              <td className="py-3.5 px-4 text-muted">{row.allergies || 'None'}</td>
                              <td className="py-3.5 px-4 text-ink-soft">{row.village}</td>
                              <td className="py-3.5 px-4 font-medium text-saffron-dark">
                                {dindiName} ({dindiNumber})
                              </td>
                              <td className="py-3.5 px-4">
                                <EmergencyContactsCell contacts={row.emergency_contacts} />
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRecord(row);
                                      setFormModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-parchment"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingRecord(row);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-muted hover:text-semantic-critical rounded-lg hover:bg-semantic-critical/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Actor Entry & Edit Modal */}
      <ActorFormModal
        isOpen={formModalOpen}
        activeTab={activeTab}
        vari={vari}
        editingRecord={editingRecord}
        onClose={() => {
          setFormModalOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Record Confirmation Modal */}
      <DeleteActorModal
        isOpen={deleteModalOpen}
        activeTab={activeTab}
        record={deletingRecord}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingRecord(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

// Compact Emergency Contacts Cell
function EmergencyContactsCell({ contacts }: { contacts?: EmergencyContact[] }) {
  if (!contacts || contacts.length === 0) {
    return <span className="text-muted text-xs">—</span>;
  }

  return (
    <div className="flex flex-col gap-1 py-0.5">
      {contacts.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px] leading-tight">
          <PhoneCall className="w-2.5 h-2.5 text-saffron shrink-0" />
          <span className="font-bold text-ink">{c.name}:</span>
          <span className="font-mono text-muted">{c.phone_number}</span>
        </div>
      ))}
    </div>
  );
}

// Clean Empty State for Active Sheet
function EmptySheetView({ role, onAdd }: { role: string; onAdd: () => void }) {
  return (
    <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-parchment-light border border-surface-border text-saffron flex items-center justify-center mb-4 shadow-2xs">
        <FileSpreadsheet className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-extrabold text-ink tracking-tight mb-1">
        No {role} records logged
      </h3>
      <p className="text-xs text-muted max-w-sm mb-6 leading-relaxed">
        This sheet is currently empty for this Vari. Add the first {role.toLowerCase()} to populate
        records with emergency contact info and auto-linked Dindi context.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-surface-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add First {role}</span>
      </button>
    </div>
  );
}

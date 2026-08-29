'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  AlertCircle,
  Shield,
  MapPin,
  Compass,
  User,
  Phone,
  HeartPulse,
  AlertTriangle,
  PhoneCall,
  Plus,
  Trash2,
  Crown,
} from 'lucide-react';
import { Vari, StartPoint, DindiLeaderProfile, EmergencyContact } from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

interface VariFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vari: Vari, leaderProfile?: DindiLeaderProfile, isEdit?: boolean) => void;
  editingVari?: Vari | null;
  existingVariNumbers: string[];
}

export const VariFormModal: React.FC<VariFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingVari = null,
  existingVariNumbers = [],
}) => {
  const isEdit = !!editingVari;

  // Vari Fields
  const [variNumber, setVariNumber] = useState('');
  const [startPoint, setStartPoint] = useState<StartPoint>('Dehu');

  // Dindi Leader Profile Fields (1-to-1 relationship)
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderVillage, setLeaderVillage] = useState('');
  const [leaderMedicalConditions, setLeaderMedicalConditions] = useState('');
  const [leaderAllergies, setLeaderAllergies] = useState('');
  const [leaderEmergencyContacts, setLeaderEmergencyContacts] = useState<
    { name: string; phone_number: string }[]
  >([{ name: '', phone_number: '' }]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (editingVari) {
      setVariNumber(editingVari.vari_number);
      setStartPoint(editingVari.start_point);
      setLeaderName(editingVari.dindi_leader_name);

      // Fetch existing leader details for this Vari if editing
      const fetchLeaderDetails = async () => {
        const { data: leaderData } = await supabase
          .from('vari_dindi_malaks')
          .select('*')
          .eq('vari_id', editingVari.id)
          .single();

        if (leaderData) {
          setLeaderPhone(leaderData.mobile_number || '');
          setLeaderVillage(leaderData.village || '');
          setLeaderMedicalConditions(leaderData.medical_conditions || '');
          setLeaderAllergies(leaderData.allergies || '');

          const { data: contactsData } = await supabase
            .from('vari_actor_emergency_contacts')
            .select('*')
            .eq('actor_id', leaderData.id)
            .eq('actor_type', 'dindi_malak');

          if (contactsData && contactsData.length > 0) {
            setLeaderEmergencyContacts(
              contactsData.map((c) => ({
                name: c.name,
                phone_number: c.phone_number,
              }))
            );
          } else {
            setLeaderEmergencyContacts([{ name: '', phone_number: '' }]);
          }
        }
      };

      fetchLeaderDetails();
    } else {
      // Auto-suggest next Vari Number
      const nextCount = existingVariNumbers.length + 1;
      const suggested = `Vari ${nextCount < 10 ? '0' + nextCount : nextCount}`;
      setVariNumber(suggested);
      setStartPoint('Dehu');
      setLeaderName('');
      setLeaderPhone('');
      setLeaderVillage('');
      setLeaderMedicalConditions('');
      setLeaderAllergies('');
      setLeaderEmergencyContacts([{ name: '', phone_number: '' }]);
    }
    setErrorMessage(null);
  }, [editingVari, isOpen, existingVariNumbers.length]);

  if (!isOpen) return null;

  // Emergency contact row helpers
  const addContactRow = () => {
    setLeaderEmergencyContacts((prev) => [...prev, { name: '', phone_number: '' }]);
  };

  const removeContactRow = (idx: number) => {
    setLeaderEmergencyContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateContactRow = (idx: number, field: 'name' | 'phone_number', val: string) => {
    setLeaderEmergencyContacts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanVariNumber = variNumber.trim();
    const cleanLeaderName = leaderName.trim();
    const cleanPhone = leaderPhone.replace(/\D/g, '');
    const cleanVillage = leaderVillage.trim();
    const cleanConditions = leaderMedicalConditions.trim() || 'None';
    const cleanAllergies = leaderAllergies.trim() || 'None';

    // 1. Vari validations
    if (!cleanVariNumber) {
      setErrorMessage('Vari Number is required.');
      return;
    }

    if (!isEdit && existingVariNumbers.some((n) => n.toLowerCase() === cleanVariNumber.toLowerCase())) {
      setErrorMessage(`A Vari with number "${cleanVariNumber}" already exists.`);
      return;
    }

    // 2. Leader validations
    if (!cleanLeaderName) {
      setErrorMessage('Dindi Leader Name is required.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Leader mobile number must be at least 10 digits.');
      return;
    }

    if (!cleanVillage) {
      setErrorMessage('Leader Village / Place of Origin is required.');
      return;
    }

    // 3. Emergency contacts validation
    const validContacts: { name: string; phone_number: string }[] = [];
    for (let i = 0; i < leaderEmergencyContacts.length; i++) {
      const c = leaderEmergencyContacts[i];
      const cName = c.name.trim();
      const cPhone = c.phone_number.replace(/\D/g, '');

      if (cName || cPhone) {
        if (!cName) {
          setErrorMessage(`Emergency contact #${i + 1} requires a Name.`);
          return;
        }
        if (cPhone.length < 10) {
          setErrorMessage(`Emergency contact #${i + 1} requires a valid 10-digit phone number.`);
          return;
        }
        validContacts.push({
          name: cName,
          phone_number: cPhone.length === 10 ? `+91 ${cPhone}` : `+${cPhone}`,
        });
      }
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
    setLoading(true);

    try {
      let savedVari: Vari;

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
      const dindiName = dindiNameMap[startPoint] || `${startPoint} Palkhi Dindi`;

      if (isEdit && editingVari) {
        // Update Vari instance
        const { data: variData, error: variErr } = await supabase
          .from('vari')
          .update({
            vari_number: cleanVariNumber,
            dindi_leader_name: cleanLeaderName,
            start_point: startPoint,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVari.id)
          .select()
          .single();

        if (variErr) throw variErr;
        savedVari = variData as Vari;

        // Upsert 1-to-1 Leader Profile
        const { data: leaderData, error: leaderErr } = await supabase
          .from('vari_dindi_malaks')
          .upsert(
            {
              vari_id: savedVari.id,
              full_name: cleanLeaderName,
              mobile_number: formattedPhone,
              village: cleanVillage,
              medical_conditions: cleanConditions,
              allergies: cleanAllergies,
              dindi_name: dindiName,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'vari_id' }
          )
          .select()
          .single();

        if (leaderErr) throw leaderErr;

        // Update Leader Emergency Contacts
        await supabase
          .from('vari_actor_emergency_contacts')
          .delete()
          .eq('actor_id', leaderData.id)
          .eq('actor_type', 'dindi_malak');

        let savedContacts: EmergencyContact[] = [];
        if (validContacts.length > 0) {
          const contactRows = validContacts.map((c) => ({
            actor_id: leaderData.id,
            actor_type: 'dindi_malak',
            name: c.name,
            phone_number: c.phone_number,
            relationship: 'Emergency Contact',
          }));

          const { data: cData, error: cErr } = await supabase
            .from('vari_actor_emergency_contacts')
            .insert(contactRows)
            .select();

          if (cErr) throw cErr;
          savedContacts = (cData as EmergencyContact[]) || [];
        }

        const fullLeaderProfile: DindiLeaderProfile = {
          ...leaderData,
          vari: savedVari,
          emergency_contacts: savedContacts,
        };

        onSuccess(savedVari, fullLeaderProfile, true);
      } else {
        // Create new Vari instance
        const { data: variData, error: variErr } = await supabase
          .from('vari')
          .insert([
            {
              vari_number: cleanVariNumber,
              dindi_leader_name: cleanLeaderName,
              start_point: startPoint,
              destination: 'Pandharpur',
            },
          ])
          .select()
          .single();

        if (variErr) throw variErr;
        savedVari = variData as Vari;

        // Automatically Create 1-to-1 Dindi Leader Record
        const { data: leaderData, error: leaderErr } = await supabase
          .from('vari_dindi_malaks')
          .insert([
            {
              vari_id: savedVari.id,
              full_name: cleanLeaderName,
              mobile_number: formattedPhone,
              village: cleanVillage,
              medical_conditions: cleanConditions,
              allergies: cleanAllergies,
              dindi_name: dindiName,
            },
          ])
          .select()
          .single();

        if (leaderErr) throw leaderErr;

        // Insert Leader Emergency Contacts
        let savedContacts: EmergencyContact[] = [];
        if (validContacts.length > 0) {
          const contactRows = validContacts.map((c) => ({
            actor_id: leaderData.id,
            actor_type: 'dindi_malak',
            name: c.name,
            phone_number: c.phone_number,
            relationship: 'Emergency Contact',
          }));

          const { data: cData, error: cErr } = await supabase
            .from('vari_actor_emergency_contacts')
            .insert(contactRows)
            .select();

          if (cErr) throw cErr;
          savedContacts = (cData as EmergencyContact[]) || [];
        }

        const fullLeaderProfile: DindiLeaderProfile = {
          ...leaderData,
          vari: savedVari,
          emergency_contacts: savedContacts,
        };

        onSuccess(savedVari, fullLeaderProfile, false);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving Vari and Leader Profile:', err);
      setErrorMessage(err?.message || 'Failed to save Vari.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-elevated overflow-y-auto max-h-[92vh] my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink tracking-tight">
                {isEdit ? 'Edit Vari & Dindi Leader' : 'Create New Vari & Dindi Leader'}
              </h2>
              <span className="text-xs text-muted font-normal">
                Pilgrimage Route Instance & 1-to-1 Leader Profile Configuration
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-parchment transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-semantic-critical/10 border border-semantic-critical/20 flex items-start gap-2.5 text-semantic-critical text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: VARI ROUTE INSTANCE */}
          <div className="p-4 rounded-2xl bg-parchment-light/60 border border-surface-border space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-dark pb-1 border-b border-surface-border/50">
              <Shield className="w-3.5 h-3.5" />
              <span>1. Pilgrimage Vari Route Instance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Vari Number / Title *
                </label>
                <input
                  type="text"
                  required
                  value={variNumber}
                  onChange={(e) => setVariNumber(e.target.value)}
                  placeholder="e.g. Vari 01"
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Start Point *
                </label>
                <select
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value as StartPoint)}
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-ink focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Dehu">Dehu (Sant Tukaram Maharaj)</option>
                  <option value="Alandi">Alandi (Sant Dnyaneshwar Maharaj)</option>
                  <option value="Paithan">Paithan (Sant Eknath Maharaj)</option>
                  <option value="Trimbakeshwar">Trimbakeshwar (Sant Nivruttinath Maharaj)</option>
                  <option value="Shegaon">Shegaon (Sant Gajanan Maharaj)</option>
                  <option value="Sajjangad">Sajjangad (Samarth Ramdas Swami)</option>
                  <option value="Saswad">Saswad (Sant Sopandev Maharaj)</option>
                  <option value="Murtijapur">Murtijapur (Sant Gadge Maharaj)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Destination (Fixed)
                </label>
                <input
                  type="text"
                  disabled
                  value="Pandharpur"
                  className="w-full bg-parchment-deep/40 border border-surface-border rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-ink/70 cursor-not-allowed opacity-80"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: 1-TO-1 DINDI LEADER PROFILE */}
          <div className="p-4 rounded-2xl bg-parchment-light/60 border border-surface-border space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-dark pb-1 border-b border-surface-border/50">
              <Crown className="w-3.5 h-3.5" />
              <span>2. Dindi Leader (Dindi Malak) Profile (1-to-1)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Leader Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="e.g. H.B.P. Suresh Patil"
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Leader Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={leaderPhone}
                  onChange={(e) => setLeaderPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={14}
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Leader Home Village / Town (गाव / शहर) *
                </label>
                <input
                  type="text"
                  required
                  value={leaderVillage}
                  onChange={(e) => setLeaderVillage(e.target.value)}
                  placeholder="e.g. Baramati, Satara, Sangli"
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Medical & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Medical Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={leaderMedicalConditions}
                  onChange={(e) => setLeaderMedicalConditions(e.target.value)}
                  placeholder="e.g. Diabetes, BP (or None)"
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Allergies (Optional)
                </label>
                <input
                  type="text"
                  value={leaderAllergies}
                  onChange={(e) => setLeaderAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Dust (or None)"
                  className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Leader Emergency Contacts */}
            <div className="pt-2 border-t border-surface-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3 text-saffron" />
                  <span>Leader Emergency Contacts (Multiple)</span>
                </span>
                <button
                  type="button"
                  onClick={addContactRow}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron hover:text-saffron-dark px-2 py-0.5 rounded-lg hover:bg-surface-white transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Another Contact</span>
                </button>
              </div>

              <div className="space-y-2">
                {leaderEmergencyContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface-white border border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContactRow(idx, 'name', e.target.value)}
                      placeholder={`Contact #${idx + 1} Name`}
                      className="flex-1 bg-parchment-light/40 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={contact.phone_number}
                      onChange={(e) => updateContactRow(idx, 'phone_number', e.target.value)}
                      placeholder="Mobile: 98765 00000"
                      maxLength={14}
                      className="flex-1 bg-parchment-light/40 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
                    />
                    {leaderEmergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactRow(idx)}
                        className="p-1.5 rounded-lg text-muted hover:text-semantic-critical hover:bg-semantic-critical/10 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-surface-border/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-surface-border hover:bg-parchment text-xs font-bold text-ink transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-surface-white font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Save Vari & Leader Changes' : 'Create Vari & Link Leader'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

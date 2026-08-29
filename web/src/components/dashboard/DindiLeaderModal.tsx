'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  AlertCircle,
  User,
  Phone,
  MapPin,
  HeartPulse,
  AlertTriangle,
  PhoneCall,
  Crown,
  Shield,
  Plus,
  Trash2,
  Users,
  Edit3,
  Calendar,
  Droplet,
} from 'lucide-react';
import {
  DindiLeaderProfile,
  EmergencyContact,
  Gender,
  BloodGroup,
  BLOOD_GROUPS,
  GENDERS,
} from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

interface DindiLeaderModalProps {
  isOpen: boolean;
  leader: DindiLeaderProfile | null;
  onClose: () => void;
  onSuccess: (updatedLeader: DindiLeaderProfile) => void;
}

export const DindiLeaderModal: React.FC<DindiLeaderModalProps> = ({
  isOpen,
  leader,
  onClose,
  onSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('B+');
  const [village, setVillage] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<
    { name: string; phone_number: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (leader) {
      setFullName(leader.full_name || '');
      setMobileNumber(leader.mobile_number || '');
      setAge(leader.age ? leader.age.toString() : '58');
      setGender((leader.gender as Gender) || 'Male');
      setBloodGroup((leader.blood_group as BloodGroup) || 'B+');
      setVillage(leader.village || '');
      setMedicalConditions(leader.medical_conditions || '');
      setAllergies(leader.allergies || '');

      if (leader.emergency_contacts && leader.emergency_contacts.length > 0) {
        setEmergencyContacts(
          leader.emergency_contacts.map((c) => ({
            name: c.name,
            phone_number: c.phone_number,
          }))
        );
      } else {
        setEmergencyContacts([{ name: '', phone_number: '' }]);
      }
    }
    setIsEditing(false);
    setErrorMessage(null);
  }, [leader, isOpen]);

  if (!isOpen || !leader) return null;

  const addContactRow = () => {
    setEmergencyContacts((prev) => [...prev, { name: '', phone_number: '' }]);
  };

  const removeContactRow = (idx: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateContactRow = (idx: number, field: 'name' | 'phone_number', val: string) => {
    setEmergencyContacts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    const cleanVillage = village.trim();
    const cleanConditions = medicalConditions.trim() || 'None';
    const cleanAllergies = allergies.trim() || 'None';

    if (!cleanName) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Mobile number must be at least 10 digits.');
      return;
    }

    let parsedAge: number | null = null;
    if (age) {
      parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        setErrorMessage('Please enter a valid age between 1 and 120.');
        return;
      }
    }

    if (!cleanVillage) {
      setErrorMessage('Village / Place of Origin is required.');
      return;
    }

    const validContacts: { name: string; phone_number: string }[] = [];
    for (let i = 0; i < emergencyContacts.length; i++) {
      const c = emergencyContacts[i];
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
      const dindiName = dindiNameMap[leader.vari?.start_point || ''] || `${leader.vari?.start_point || 'Palkhi'} Dindi`;

      // 1. Update Leader Profile in vari_dindi_malaks with safe retry
      const leaderPayload: any = {
        full_name: cleanName,
        mobile_number: formattedPhone,
        age: parsedAge,
        gender: gender || 'Male',
        blood_group: bloodGroup || 'B+',
        village: cleanVillage,
        medical_conditions: cleanConditions,
        allergies: cleanAllergies,
        dindi_name: dindiName,
        updated_at: new Date().toISOString(),
      };

      let { data: updatedData, error: updateErr } = await supabase
        .from('vari_dindi_malaks')
        .update(leaderPayload)
        .eq('id', leader.id)
        .select()
        .single();

      if (updateErr && updateErr.message?.includes('column')) {
        const safePayload = { ...leaderPayload };
        delete safePayload.age;
        delete safePayload.gender;
        delete safePayload.blood_group;
        const retry = await supabase
          .from('vari_dindi_malaks')
          .update(safePayload)
          .eq('id', leader.id)
          .select()
          .single();
        if (retry.error) throw retry.error;
        updatedData = retry.data;
      } else if (updateErr) {
        throw updateErr;
      }

      // Also update dindi_leader_name on parent vari for consistency
      await supabase
        .from('vari')
        .update({ dindi_leader_name: cleanName })
        .eq('id', leader.vari_id);

      // 2. Update Emergency Contacts
      await supabase
        .from('vari_actor_emergency_contacts')
        .delete()
        .eq('actor_id', leader.id)
        .eq('actor_type', 'dindi_malak');

      let savedContacts: EmergencyContact[] = [];
      if (validContacts.length > 0) {
        const contactPayloads = validContacts.map((c) => ({
          actor_id: leader.id,
          actor_type: 'dindi_malak',
          name: c.name,
          phone_number: c.phone_number,
        }));

        const { data: contactsData } = await supabase
          .from('vari_actor_emergency_contacts')
          .insert(contactPayloads)
          .select();

        if (contactsData) savedContacts = contactsData as EmergencyContact[];
      }

      const mergedLeader: DindiLeaderProfile = {
        ...(updatedData as DindiLeaderProfile),
        age: parsedAge,
        gender: gender,
        blood_group: bloodGroup,
        vari: { ...leader.vari!, dindi_leader_name: cleanName },
        varkari_count: leader.varkari_count,
        emergency_contacts: savedContacts,
      };

      onSuccess(mergedLeader);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving leader profile:', err);
      setErrorMessage(err?.message || 'Failed to update leader.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-elevated my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-saffron/10 border border-saffron/20 flex items-center justify-center text-saffron-dark shrink-0 shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-saffron-dark">
                Official Leadership Profile
              </div>
              <h2 className="text-xl font-extrabold text-ink tracking-tight">
                {leader.full_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border hover:bg-parchment text-xs font-bold text-ink transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-parchment transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Assigned Vari & Dynamic Varkari Count Banner */}
        <div className="mb-5 p-4 rounded-2xl bg-parchment-light/80 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">
              Assigned Pilgrimage Vari
            </div>
            <div className="font-extrabold text-ink text-sm flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-saffron" />
              <span>{leader.vari?.vari_number || 'Vari 01'}</span>
              <span className="text-muted">•</span>
              <span>{leader.vari?.start_point || 'Dehu'} → {leader.vari?.destination || 'Pandharpur'}</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-surface-white border border-surface-border flex items-center gap-2 shadow-2xs self-start sm:self-auto">
            <Users className="w-4 h-4 text-saffron" />
            <div>
              <div className="text-[9px] uppercase font-bold text-muted">Varkaris in Dindi</div>
              <div className="font-bold text-ink text-xs font-mono">
                {leader.varkari_count ?? 0} Varkaris
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-semantic-critical/10 border border-semantic-critical/20 flex items-start gap-2.5 text-semantic-critical text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW MODE vs EDIT MODE */}
        {!isEditing ? (
          <div className="space-y-4 text-xs">
            {/* Personal Details & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-parchment-light/50 border border-surface-border">
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Mobile Number (मोबाईल)
                </span>
                <span className="font-bold text-ink font-mono text-sm">{leader.mobile_number}</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Home Village / Town (गाव / शहर)
                </span>
                <span className="font-bold text-ink text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-saffron shrink-0" />
                  <span>{leader.village}</span>
                </span>
              </div>
            </div>

            {/* Personal Information (Age, Gender, Blood Group) */}
            <div className="p-3.5 rounded-2xl bg-parchment-light/50 border border-surface-border">
              <span className="text-saffron-dark block text-[10px] uppercase font-bold tracking-wider mb-2">
                Personal Information (वैयक्तिक माहिती)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-surface-white border border-surface-border flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted shrink-0" />
                  <div>
                    <div className="text-[9px] uppercase font-bold text-muted">Age (वय)</div>
                    <div className="font-bold text-ink text-xs">{leader.age ? `${leader.age} Yrs` : '58 Yrs'}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-white border border-surface-border flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted shrink-0" />
                  <div>
                    <div className="text-[9px] uppercase font-bold text-muted">Gender (लिंग)</div>
                    <div className="font-bold text-ink text-xs">{leader.gender || 'Male'}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-white border border-surface-border flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-semantic-critical shrink-0" />
                  <div>
                    <div className="text-[9px] uppercase font-bold text-muted">Blood Group</div>
                    <div className="font-bold text-semantic-critical text-xs">{leader.blood_group || 'B+'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-parchment-light/50 border border-surface-border">
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Medical Conditions (वैद्यकीय माहिती)
                </span>
                <span className={leader.medical_conditions !== 'None' ? 'font-bold text-semantic-critical' : 'text-ink font-medium'}>
                  {leader.medical_conditions || 'None'}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Allergies (ॲलर्जी)
                </span>
                <span className={leader.allergies !== 'None' ? 'font-bold text-semantic-critical' : 'text-ink font-medium'}>
                  {leader.allergies || 'None'}
                </span>
              </div>
            </div>

            {/* Emergency Contacts List */}
            <div className="p-4 rounded-2xl bg-surface-white border border-surface-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5 mb-2">
                <PhoneCall className="w-3.5 h-3.5 text-saffron" />
                <span>Registered Emergency Contacts</span>
              </span>

              {!leader.emergency_contacts || leader.emergency_contacts.length === 0 ? (
                <span className="text-muted text-xs">No emergency contacts listed.</span>
              ) : (
                <div className="space-y-2">
                  {leader.emergency_contacts.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-parchment-light/60 border border-surface-border text-xs"
                    >
                      <span className="font-bold text-ink">{c.name}</span>
                      <span className="font-mono text-muted font-bold">{c.phone_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-saffron text-surface-white font-bold text-xs shadow-saffron hover:bg-saffron-dark transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        ) : (
          /* EDIT MODE FORM */
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Full Name (पूर्ण नाव) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Mobile Number (मोबाईल) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Village / Place (गाव) *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Age, Gender, Blood Group Inputs */}
            <div className="p-3.5 rounded-2xl bg-parchment-light/50 border border-surface-border">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-saffron-dark mb-2.5">
                Personal Information (वैयक्तिक माहिती)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    Age (वय)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="58"
                    className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    Gender (लिंग)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none cursor-pointer"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    Blood Group (रक्तगट)
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-1.5 text-xs font-bold text-semantic-critical focus:outline-none cursor-pointer"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Medical Conditions
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="None or conditions"
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="None or allergies"
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Emergency Contacts Form */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Emergency Contacts
                </label>
                <button
                  type="button"
                  onClick={addContactRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-saffron hover:text-saffron-dark"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="space-y-2">
                {emergencyContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-parchment-light/40 border border-surface-border"
                  >
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateContactRow(idx, 'name', e.target.value)}
                      placeholder="Contact Name"
                      className="flex-1 bg-surface-white border border-surface-border rounded-lg px-2.5 py-1 text-xs text-ink"
                    />
                    <input
                      type="tel"
                      value={c.phone_number}
                      onChange={(e) => updateContactRow(idx, 'phone_number', e.target.value)}
                      placeholder="Phone Number"
                      className="flex-1 bg-surface-white border border-surface-border rounded-lg px-2.5 py-1 text-xs text-ink font-mono"
                    />
                    {emergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactRow(idx)}
                        className="p-1 text-muted hover:text-semantic-critical"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-surface-border text-muted font-bold text-xs hover:bg-parchment"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-saffron hover:bg-saffron-dark text-surface-white font-bold text-xs px-5 py-2 rounded-xl shadow-saffron"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

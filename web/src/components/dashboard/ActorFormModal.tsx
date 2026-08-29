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
  Stethoscope,
  Lock,
  Plus,
  Trash2,
  Shield,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { SheetTab, Vari, ActorRecord, MedicalStaffRecord, EmergencyContact } from '@/types/vari';
import { supabase } from '@/lib/supabaseClient';

interface ActorFormModalProps {
  isOpen: boolean;
  activeTab: SheetTab;
  vari: Vari;
  editingRecord?: ActorRecord | null;
  onClose: () => void;
  onSuccess: (record: ActorRecord, isEdit: boolean) => void;
}

export const ActorFormModal: React.FC<ActorFormModalProps> = ({
  isOpen,
  activeTab,
  vari,
  editingRecord = null,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!editingRecord;

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [village, setVillage] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [specialization, setSpecialization] = useState('General Emergency & Trauma');

  // Dynamic Multiple Emergency Contacts List
  const [emergencyContacts, setEmergencyContacts] = useState<
    { name: string; phone_number: string }[]
  >([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived Dindi Context (Auto-populated & read-only)
  const dindiNumber = vari.vari_number;
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
  const dindiName = dindiNameMap[vari.start_point] || `${vari.start_point} Palkhi Dindi`;

  // Role labels
  const roleLabels: Record<SheetTab, { title: string; singular: string }> = {
    varkari: { title: 'Varkari Pilgrim', singular: 'Varkari' },
    volunteer: { title: 'Volunteer & Field Coordinator', singular: 'Volunteer' },
    medical_staff: { title: 'Medical Staff & Responder', singular: 'Medical Staff' },
  };

  // Populate or reset form fields
  useEffect(() => {
    if (editingRecord) {
      setFullName(editingRecord.full_name || '');
      setMobileNumber(editingRecord.mobile_number || '');
      setVillage(editingRecord.village || '');
      setMedicalConditions(editingRecord.medical_conditions || '');
      setAllergies(editingRecord.allergies || '');
      if (activeTab === 'medical_staff') {
        setSpecialization(
          (editingRecord as MedicalStaffRecord).specialization || 'General Emergency & Trauma'
        );
      }
      if (editingRecord.emergency_contacts && editingRecord.emergency_contacts.length > 0) {
        setEmergencyContacts(
          editingRecord.emergency_contacts.map((c) => ({
            name: c.name,
            phone_number: c.phone_number,
          }))
        );
      } else {
        setEmergencyContacts([{ name: '', phone_number: '' }]);
      }
    } else {
      setFullName('');
      setMobileNumber('');
      setVillage('');
      setMedicalConditions('');
      setAllergies('');
      setSpecialization('General Emergency & Trauma');
      setEmergencyContacts([{ name: '', phone_number: '' }]);
    }
    setErrorMessage(null);
  }, [editingRecord, isOpen, activeTab]);

  if (!isOpen) return null;

  // Add another contact row
  const addContactField = () => {
    setEmergencyContacts((prev) => [...prev, { name: '', phone_number: '' }]);
  };

  // Remove a contact row
  const removeContactField = (index: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== index));
  };

  // Update contact field values
  const updateContactField = (
    index: number,
    field: 'name' | 'phone_number',
    value: string
  ) => {
    setEmergencyContacts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    const cleanVillage = village.trim();
    const cleanConditions = medicalConditions.trim() || 'None';
    const cleanAllergies = allergies.trim() || 'None';

    // 1. Validate Full Name
    if (!cleanName) {
      setErrorMessage('Full Name is required.');
      return;
    }

    // 2. Validate Primary Mobile Number
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    // 3. Validate Village
    if (!cleanVillage) {
      setErrorMessage('Village / Place of Origin is required.');
      return;
    }

    // 4. Validate Specialization for Medical Staff
    if (activeTab === 'medical_staff' && !specialization.trim()) {
      setErrorMessage('Medical specialization is required.');
      return;
    }

    // 5. Validate Emergency Contacts (if name entered, phone required and vice versa)
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
          setErrorMessage(
            `Emergency contact #${i + 1} requires a valid 10-digit phone number.`
          );
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
      const tableMap: Record<SheetTab, string> = {
        varkari: 'vari_varkaris',
        volunteer: 'vari_volunteers',
        medical_staff: 'vari_medical_staff',
      };

      const targetTable = tableMap[activeTab];

      // Base Actor Payload
      const payload: any = {
        vari_id: vari.id,
        full_name: cleanName,
        mobile_number: formattedPhone,
        village: cleanVillage,
        medical_conditions: cleanConditions,
        allergies: cleanAllergies,
        updated_at: new Date().toISOString(),
      };

      if (activeTab === 'medical_staff') {
        payload.specialization = specialization;
      }

      let savedActor: ActorRecord;

      if (isEdit && editingRecord) {
        // UPDATE existing actor
        const { data, error } = await supabase
          .from(targetTable)
          .update(payload)
          .eq('id', editingRecord.id)
          .select()
          .single();

        if (error) throw error;
        savedActor = data as ActorRecord;

        // Clean previous contacts
        await supabase
          .from('vari_actor_emergency_contacts')
          .delete()
          .eq('actor_id', savedActor.id)
          .eq('actor_type', activeTab);
      } else {
        // INSERT new actor
        const { data, error } = await supabase
          .from(targetTable)
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        savedActor = data as ActorRecord;
      }

      // Insert new structured emergency contacts in child table
      let savedEmergencyContacts: EmergencyContact[] = [];
      if (validContacts.length > 0) {
        const contactRows = validContacts.map((c) => ({
          actor_id: savedActor.id,
          actor_type: activeTab,
          name: c.name,
          phone_number: c.phone_number,
          relationship: 'Emergency Contact',
        }));

        const { data: contactsData, error: contactsError } = await supabase
          .from('vari_actor_emergency_contacts')
          .insert(contactRows)
          .select();

        if (contactsError) throw contactsError;
        savedEmergencyContacts = (contactsData as EmergencyContact[]) || [];
      }

      savedActor.emergency_contacts = savedEmergencyContacts;
      onSuccess(savedActor, isEdit);
      onClose();
    } catch (err: any) {
      console.error('Error saving record and emergency contacts:', err);
      setErrorMessage(err?.message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-elevated my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border/80 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-parchment-light border border-surface-border text-[10px] font-bold uppercase tracking-widest text-saffron-dark mb-1">
              <Shield className="w-3 h-3" />
              <span>{roleLabels[activeTab].singular} Entry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              {isEdit
                ? `Edit ${roleLabels[activeTab].singular}`
                : `Add ${roleLabels[activeTab].singular}`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-parchment transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-populated Dindi Context Strip (Read-only as required) */}
        <div className="mb-5 p-3.5 rounded-2xl bg-parchment-light/80 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-saffron" />
            <span className="font-bold text-ink truncate">{dindiName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted shrink-0">
            <Lock className="w-3 h-3 text-muted" />
            <span className="font-mono font-bold text-saffron-dark">{dindiNumber}</span>
            <span className="text-[10px] uppercase font-semibold text-muted tracking-wider">
              (Auto-Linked)
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-semantic-critical/10 border border-semantic-critical/20 flex items-start gap-2.5 text-semantic-critical text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Data Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Personal Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Full Name *
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tukaram Santosh More"
                autoFocus
                className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all"
              />
            </div>
          </div>

          {/* Grid: Mobile Number & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Mobile Number *
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-muted" />
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={14}
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Village / Home Town (गाव / मूळ गाव) *
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Baramati, Satara, Kolhapur"
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Specialization (Medical Staff only) */}
          {activeTab === 'medical_staff' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Medical Specialization *
              </label>
              <div className="relative flex items-center">
                <Stethoscope className="absolute left-3.5 w-4 h-4 text-semantic-critical" />
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-saffron/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="General Emergency & Trauma">General Emergency & Trauma</option>
                  <option value="Cardiology & Resuscitation">Cardiology & Resuscitation</option>
                  <option value="Nursing & First Aid Response">Nursing & First Aid Response</option>
                  <option value="Orthopedics & Heat Exhaustion">Orthopedics & Heat Exhaustion</option>
                  <option value="Pharmacology & Medication Dispatch">Pharmacology & Medication Dispatch</option>
                </select>
              </div>
            </div>
          )}

          {/* Grid: Medical Conditions & Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                Medical Conditions (Optional)
              </label>
              <div className="relative flex items-center">
                <HeartPulse className="absolute left-3.5 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Diabetes, BP (or None)"
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                Allergies (Optional)
              </label>
              <div className="relative flex items-center">
                <AlertTriangle className="absolute left-3.5 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin (or None)"
                  className="w-full bg-parchment-light/60 border border-surface-border focus:border-saffron rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Structured Emergency Contacts (1-to-many relationship) */}
          <div className="pt-3 border-t border-surface-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink">
                <PhoneCall className="w-3.5 h-3.5 text-saffron" />
                <span>Emergency Contacts (आपत्कालीन संपर्क)</span>
              </div>
              <button
                type="button"
                onClick={addContactField}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron hover:text-saffron-dark transition-colors px-2 py-1 rounded-lg hover:bg-parchment"
              >
                <Plus className="w-3 h-3" />
                <span>Add Another Contact</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {emergencyContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-parchment-light/70 border border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContactField(idx, 'name', e.target.value)}
                      placeholder={`Contact #${idx + 1} Name (e.g. Ramesh Patil)`}
                      className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-2 text-xs font-semibold text-ink placeholder:text-muted/60 focus:outline-none"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="tel"
                      value={contact.phone_number}
                      onChange={(e) => updateContactField(idx, 'phone_number', e.target.value)}
                      placeholder="Mobile: 98765 00000"
                      maxLength={14}
                      className="w-full bg-surface-white border border-surface-border focus:border-saffron rounded-xl px-3 py-2 text-xs font-semibold text-ink placeholder:text-muted/60 focus:outline-none"
                    />
                  </div>

                  {emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactField(idx)}
                      className="p-2 rounded-xl text-muted hover:text-semantic-critical hover:bg-semantic-critical/10 transition-colors self-end sm:self-center"
                      title="Remove this contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-5 border-t border-surface-border/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-surface-border hover:bg-parchment text-xs font-bold text-ink transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-surface-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-saffron transition-all transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Record' : `Save ${roleLabels[activeTab].singular}`}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

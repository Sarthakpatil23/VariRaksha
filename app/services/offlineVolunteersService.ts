/**
 * VariRaksha — Offline Dindi Volunteers Service
 *
 * Provides phone contacts of 2 dedicated volunteers from the same Dindi/Vari
 * for direct calling when the pilgrim is offline or without internet connectivity.
 */

export interface DindiVolunteerContact {
  id: string;
  name: string;
  nameMr: string;
  phone: string;
  role: string;
  roleMr: string;
  dindiName: string;
  dindiNumber: string;
  avatarIcon: string;
  availability: 'On Duty' | 'Near You';
}

const VOLUNTEERS_BY_DINDI: Record<string, DindiVolunteerContact[]> = {
  // Sant Tukaram Maharaj Dindi (Dehu -> Pandharpur)
  tukaram: [
    {
      id: 'vol-tuk-1',
      name: 'Rameshwar Patil',
      nameMr: 'रामेश्वर पाटील',
      phone: '+91 94230 11221',
      role: 'Lead Dindi First Responder',
      roleMr: 'प्रमुख दिंडी स्वयंसेवक व प्रथमोपचार',
      dindiName: 'Sant Tukaram Maharaj Dindi',
      dindiNumber: '01',
      avatarIcon: 'shield-checkmark',
      availability: 'Near You',
    },
    {
      id: 'vol-tuk-2',
      name: 'Tukaram Shinde',
      nameMr: 'तुकाराम शिंदे',
      phone: '+91 98221 44550',
      role: 'Emergency Medical Assistant',
      roleMr: 'आपत्कालीन वैद्यकीय मदतनीस',
      dindiName: 'Sant Tukaram Maharaj Dindi',
      dindiNumber: '01',
      avatarIcon: 'medkit',
      availability: 'On Duty',
    },
  ],

  // Sant Dnyaneshwar Maharaj Dindi (Alandi -> Pandharpur)
  dnyaneshwar: [
    {
      id: 'vol-dny-1',
      name: 'Sopanrao Deshmukh',
      nameMr: 'सोपानराव देशमुख',
      phone: '+91 98233 77881',
      role: 'Lead Dindi First Responder',
      roleMr: 'प्रमुख दिंडी स्वयंसेवक व प्रथमोपचार',
      dindiName: 'Sant Dnyaneshwar Maharaj Dindi',
      dindiNumber: '12',
      avatarIcon: 'shield-checkmark',
      availability: 'Near You',
    },
    {
      id: 'vol-dny-2',
      name: 'Ganesh Kadam',
      nameMr: 'गणेश कदम',
      phone: '+91 98765 43210',
      role: 'Emergency Medical Assistant',
      roleMr: 'आपत्कालीन वैद्यकीय मदतनीस',
      dindiName: 'Sant Dnyaneshwar Maharaj Dindi',
      dindiNumber: '12',
      avatarIcon: 'medkit',
      availability: 'On Duty',
    },
  ],
};

/**
 * Get 2 volunteers from the same Dindi as the pilgrim
 */
export function getVolunteersForDindi(dindiName?: string): DindiVolunteerContact[] {
  const normalized = (dindiName || '').toLowerCase();

  if (normalized.includes('dnyaneshwar') || normalized.includes('alandi') || normalized.includes('12')) {
    return VOLUNTEERS_BY_DINDI.dnyaneshwar;
  }

  // Default to Tukaram or general Wari volunteers
  return VOLUNTEERS_BY_DINDI.tukaram;
}

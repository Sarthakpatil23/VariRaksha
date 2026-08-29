/**
 * VariRaksha Dynamic Response Priority Engine
 * 
 * Single source of truth for calculating dynamic triage and response priorities
 * for Varkari emergency SOS incidents.
 * 
 * Heuristics:
 * 1. Base Severity: Critical (100), High (70), Moderate (40), Low (20)
 * 2. Varkari Age: <50 (+0), 50-64 (+5), 65-74 (+10), 75+ (+15)
 * 3. Medical Vulnerability: Cardiac (+15), Severe Respiratory (+15), Diabetes (+8), Hypertension (+5), Other/Allergy (+3)
 * 4. Emergency Type: Chest Pain/Breathing/Unconscious (+30), Major Injury/Bleeding (+25), Dehydration/Heat (+20), Lost/Separated (+10), Minor Help (+5)
 * 5. Waiting Time Bonus: min(minutes_unresolved * 0.5, 20)
 * 6. Recency Boost: <=5m (+10), <=10m (+5), >10m (+0)
 * 7. Priority Bands: CRITICAL (Band 4), HIGH (Band 3), MODERATE (Band 2), LOW (Band 1)
 *    * Note: Critical severity floor ensures critical incidents always maintain top precedence.
 */

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface PriorityFactorsBreakdown {
  severityBase: number;
  severityLabel: string;
  ageBonus: number;
  ageLabel?: string;
  medicalBonus: number;
  medicalTags: string[];
  typeBonus: number;
  typeLabel?: string;
  waitingBonus: number;
  waitingMinutes: number;
  recencyBonus: number;
  rawScore: number;
  effectiveScore: number;
  priorityLevel: PriorityLevel;
  bandRank: number;
  explanation: string;
}

export interface PrioritizedAlertInput {
  severity?: string;
  problem_type?: string;
  description?: string;
  notes?: string;
  pilgrim_age?: number;
  medical_context?: string;
  created_at?: string;
  resolved_at?: string;
  status?: string;
  priority_factors?: any;
}

/**
 * Evaluates the dynamic response priority for an emergency alert
 */
export function calculateDynamicPriority(
  alert: PrioritizedAlertInput,
  referenceTimeMs: number = Date.now(),
): PriorityFactorsBreakdown {
  const explanationTags: string[] = [];

  // 1. Severity Base
  const sevLower = (alert.severity || 'moderate').toLowerCase();
  let severityBase = 40;
  let severityLabel = 'Moderate';

  if (sevLower === 'critical') {
    severityBase = 100;
    severityLabel = 'Critical Emergency';
  } else if (sevLower === 'high') {
    severityBase = 70;
    severityLabel = 'High Severity';
  } else if (sevLower === 'moderate') {
    severityBase = 40;
    severityLabel = 'Moderate Severity';
  } else if (sevLower === 'normal' || sevLower === 'low') {
    severityBase = 20;
    severityLabel = 'Low Severity';
  }

  // 2. Age Bonus
  const age = alert.pilgrim_age || 0;
  let ageBonus = 0;
  let ageLabel: string | undefined;

  if (age >= 75) {
    ageBonus = 15;
    ageLabel = `${age}+ yrs`;
    explanationTags.push(`Elderly (${age}+)`);
  } else if (age >= 65) {
    ageBonus = 10;
    ageLabel = `${age} yrs (65+)`;
    explanationTags.push(`Senior (${age})`);
  } else if (age >= 50) {
    ageBonus = 5;
    ageLabel = `${age} yrs (50-64)`;
    explanationTags.push(`Age ${age}`);
  }

  // 3. Medical Vulnerability History
  const medicalText = `${alert.medical_context || ''} ${alert.notes || ''} ${alert.description || ''}`.toLowerCase();
  let medicalBonus = 0;
  const medicalTags: string[] = [];

  const isCardiac =
    medicalText.includes('cardiac') ||
    medicalText.includes('heart') ||
    medicalText.includes('stroke') ||
    medicalText.includes('हृदय') ||
    medicalText.includes('pacemaker');
  if (isCardiac) {
    medicalBonus += 15;
    medicalTags.push('Cardiac Condition');
    explanationTags.push('Cardiac history');
  }

  const isRespiratory =
    medicalText.includes('asthma') ||
    medicalText.includes('respiratory') ||
    medicalText.includes('copd') ||
    medicalText.includes('दमा') ||
    medicalText.includes('श्वास');
  if (isRespiratory) {
    medicalBonus += 15;
    medicalTags.push('Respiratory');
    explanationTags.push('Asthma / Respiratory');
  }

  const isDiabetes =
    medicalText.includes('diabetes') ||
    medicalText.includes('diabetic') ||
    medicalText.includes('मधुमेह') ||
    medicalText.includes('sugar');
  if (isDiabetes) {
    medicalBonus += 8;
    medicalTags.push('Diabetes');
    explanationTags.push('Diabetes');
  }

  const isHypertension =
    medicalText.includes('hypertension') ||
    medicalText.includes('bp') ||
    medicalText.includes('blood pressure') ||
    medicalText.includes('रक्तदाब');
  if (isHypertension) {
    medicalBonus += 5;
    medicalTags.push('Hypertension');
    explanationTags.push('High BP');
  }

  const hasOtherAllergy =
    (medicalText.includes('allerg') || medicalText.includes('chronic') || medicalText.includes('ऍलर्जी')) &&
    !isCardiac &&
    !isRespiratory;
  if (hasOtherAllergy) {
    medicalBonus += 3;
    medicalTags.push('Allergies');
    explanationTags.push('Allergies on file');
  }

  // 4. Emergency Type Modifiers
  const problemText = `${alert.problem_type || ''} ${alert.description || ''} ${alert.notes || ''}`.toLowerCase();
  let typeBonus = 0;
  let typeLabel: string | undefined;

  const isChestPainOrBreathing =
    problemText.includes('chest') ||
    problemText.includes('breath') ||
    problemText.includes('unconscious') ||
    problemText.includes('faint') ||
    problemText.includes('cardiac') ||
    problemText.includes('छातीत दुखणे') ||
    problemText.includes('श्वास त्रास') ||
    problemText.includes('बेशुद्ध');

  const isMajorInjury =
    problemText.includes('injur') ||
    problemText.includes('bleed') ||
    problemText.includes('fracture') ||
    problemText.includes('wound') ||
    problemText.includes('दुखापत') ||
    problemText.includes('जखम') ||
    problemText.includes('रक्त');

  const isDehydrationHeat =
    problemText.includes('dehydrat') ||
    problemText.includes('heat') ||
    problemText.includes('sunstroke') ||
    problemText.includes('dizzy') ||
    problemText.includes('dizziness') ||
    problemText.includes('चक्कर') ||
    problemText.includes('उष्माघात') ||
    problemText.includes('तहान');

  const isLostSeparated =
    problemText.includes('lost') ||
    problemText.includes('separat') ||
    problemText.includes('हरवले') ||
    problemText.includes('दिंडी');

  if (isChestPainOrBreathing) {
    typeBonus = 30;
    typeLabel = 'Chest pain / Breathing distress';
    explanationTags.push('Chest / Breathing distress');
  } else if (isMajorInjury) {
    typeBonus = 25;
    typeLabel = 'Major injury / Bleeding';
    explanationTags.push('Injury / Bleeding');
  } else if (isDehydrationHeat) {
    typeBonus = 20;
    typeLabel = 'Severe Dehydration / Heat illness';
    explanationTags.push('Severe Dehydration');
  } else if (isLostSeparated) {
    typeBonus = 10;
    typeLabel = 'Lost / separated from Dindi';
    explanationTags.push('Lost from Dindi');
  } else {
    typeBonus = 5;
    typeLabel = alert.problem_type || 'Assistance requested';
  }

  // 5. Waiting Time Calculation
  const createdAtMs = alert.created_at ? new Date(alert.created_at).getTime() : referenceTimeMs;
  const isResolved = alert.status === 'resolved';
  const endTimeMs = isResolved && alert.resolved_at ? new Date(alert.resolved_at).getTime() : referenceTimeMs;
  const elapsedMs = Math.max(0, endTimeMs - createdAtMs);
  const waitingMinutes = Math.floor(elapsedMs / 60000);

  // waiting_bonus = min(minutes_unresolved * 0.5, 20)
  const waitingBonus = Math.min(Math.round(waitingMinutes * 0.5 * 10) / 10, 20);
  if (waitingMinutes >= 3 && !isResolved) {
    explanationTags.push(`${waitingMinutes}m waiting`);
  }

  // 6. Recency Boost
  // first 5 mins = +10, next 5 mins = +5, after 10 mins = +0
  let recencyBonus = 0;
  if (!isResolved) {
    if (waitingMinutes <= 5) {
      recencyBonus = 10;
      explanationTags.push('Just reported');
    } else if (waitingMinutes <= 10) {
      recencyBonus = 5;
    }
  }

  // 7. Scores Calculation
  const rawScore = severityBase + ageBonus + medicalBonus + typeBonus;
  const effectiveScore = rawScore + waitingBonus + recencyBonus;

  // 8. Priority Band / Floor Rules
  let priorityLevel: PriorityLevel = 'LOW';
  let bandRank = 1;

  // Critical Floor: Genuinely critical emergencies stay locked in the CRITICAL band
  if (sevLower === 'critical' || effectiveScore >= 120) {
    priorityLevel = 'CRITICAL';
    bandRank = 4;
  } else if (sevLower === 'high' || effectiveScore >= 80) {
    priorityLevel = 'HIGH';
    bandRank = 3;
  } else if (sevLower === 'moderate' || effectiveScore >= 45) {
    priorityLevel = 'MODERATE';
    bandRank = 2;
  } else {
    priorityLevel = 'LOW';
    bandRank = 1;
  }

  const explanation = explanationTags.length > 0 ? explanationTags.join(' · ') : `${severityLabel} · Standard response`;

  return {
    severityBase,
    severityLabel,
    ageBonus,
    ageLabel,
    medicalBonus,
    medicalTags,
    typeBonus,
    typeLabel,
    waitingBonus,
    waitingMinutes,
    recencyBonus,
    rawScore,
    effectiveScore,
    priorityLevel,
    bandRank,
    explanation,
  };
}

/**
 * Sort comparator for prioritizing emergency queues
 * Ordering:
 * 1. Priority Band (CRITICAL > HIGH > MODERATE > LOW)
 * 2. Effective Priority Score (Descending)
 * 3. Creation Time (Newest first)
 */
export function compareAlertPriority(
  a: PrioritizedAlertInput,
  b: PrioritizedAlertInput,
  referenceTimeMs: number = Date.now(),
): number {
  const pA = calculateDynamicPriority(a, referenceTimeMs);
  const pB = calculateDynamicPriority(b, referenceTimeMs);

  // Status precedence: nearby/open first, in_progress second, resolved last
  const statusWeight: Record<string, number> = { nearby: 1, in_progress: 2, resolved: 3 };
  const statA = statusWeight[a.status || 'nearby'] || 2;
  const statB = statusWeight[b.status || 'nearby'] || 2;
  if (statA !== statB) return statA - statB;

  // 1. Priority Band Rank (4: Critical, 3: High, 2: Moderate, 1: Low)
  if (pA.bandRank !== pB.bandRank) {
    return pB.bandRank - pA.bandRank;
  }

  // 2. Effective Priority Score
  if (pA.effectiveScore !== pB.effectiveScore) {
    return pB.effectiveScore - pA.effectiveScore;
  }

  // 3. Newest Creation Time
  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
  return timeB - timeA;
}

/**
 * Enriches and sorts a list of alerts with live dynamic response priorities
 */
export function prioritizeEmergencyAlerts<T extends PrioritizedAlertInput>(
  alerts: T[],
  referenceTimeMs: number = Date.now(),
): (T & { priorityData: PriorityFactorsBreakdown })[] {
  return alerts
    .map((alert) => ({
      ...alert,
      priorityData: calculateDynamicPriority(alert, referenceTimeMs),
    }))
    .sort((a, b) => compareAlertPriority(a, b, referenceTimeMs));
}

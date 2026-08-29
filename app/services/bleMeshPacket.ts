/**
 * VariRaksha — BLE Mesh SOS Packet Encoder / Decoder
 *
 * Compact packet format for transmitting emergency SOS data
 * over Bluetooth Low Energy between pilgrim and volunteer devices.
 *
 * The packet is serialized as a compact JSON string stored in a
 * BLE GATT characteristic. Max ~200 bytes, well within BLE limits.
 */

// Custom VariRaksha BLE Service UUID (registered under 0xFD7A namespace)
export const VARIRAKSHA_SERVICE_UUID = '0000fd7a-0000-1000-8000-00805f9b34fb';

// Characteristic UUID for SOS data payload
export const SOS_CHARACTERISTIC_UUID = '0000fd7b-0000-1000-8000-00805f9b34fb';

// Characteristic UUID for ACK responses (volunteer → pilgrim)
export const ACK_CHARACTERISTIC_UUID = '0000fd7c-0000-1000-8000-00805f9b34fb';

/** Emergency type codes for compact encoding */
export enum EmergencyCode {
  MEDICAL = 1,
  INJURY = 2,
  HEATSTROKE = 3,
  LOST_SEPARATED = 4,
  FEELING_UNWELL = 5,
  NEED_ASSISTANCE = 6,
  OTHER = 7,
}

/** Blood group codes for compact encoding */
export const BLOOD_GROUP_MAP: Record<string, number> = {
  'A+': 1, 'A-': 2,
  'B+': 3, 'B-': 4,
  'AB+': 5, 'AB-': 6,
  'O+': 7, 'O-': 8,
};

export const BLOOD_GROUP_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(BLOOD_GROUP_MAP).map(([k, v]) => [v, k]),
);

/** Core SOS packet interface transmitted over BLE mesh */
export interface BleSosPacket {
  /** Unique 8-char hex message ID (for deduplication across hops) */
  msgId: string;
  /** Pilgrim's emergency card ID (e.g. "VK-DEHU01") */
  cardId: string;
  /** Pilgrim display name */
  pilgrimName: string;
  /** Pilgrim phone number */
  pilgrimPhone: string;
  /** Emergency type code (1-7) */
  emergencyType: EmergencyCode;
  /** Human-readable problem description */
  problemType: string;
  /** GPS latitude (hardware satellite, works offline) */
  latitude: number;
  /** GPS longitude (hardware satellite, works offline) */
  longitude: number;
  /** Time-to-live hop counter (starts at 5, decremented at each relay) */
  ttl: number;
  /** Blood group string (e.g. "B+") */
  bloodGroup: string;
  /** Pilgrim age */
  age: number;
  /** Alert severity: 'critical' | 'moderate' | 'normal' */
  severity: string;
  /** Compact medical context string */
  medicalContext: string;
  /** Dindi group name */
  dindiName: string;
  /** UNIX timestamp in seconds */
  timestamp: number;
}

/** ACK packet sent from Volunteer back to Pilgrim */
export interface BleAckPacket {
  /** Original SOS message ID being acknowledged */
  msgId: string;
  /** Volunteer's display name */
  volunteerName: string;
  /** Volunteer's phone number */
  volunteerPhone: string;
  /** Timestamp of acknowledgement */
  timestamp: number;
}

/**
 * Generate a unique 8-character hex message ID
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(16).slice(-4);
  const random = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${timestamp}${random}`;
}

/**
 * Map a human-readable problem type string to an EmergencyCode
 */
export function problemTypeToCode(problemType: string): EmergencyCode {
  const lower = problemType.toLowerCase();
  if (lower.includes('medical') || lower.includes('वैद्यकीय') || lower.includes('आपातकालीन')) {
    return EmergencyCode.MEDICAL;
  }
  if (lower.includes('injury') || lower.includes('wound') || lower.includes('दुखापत') || lower.includes('जखम')) {
    return EmergencyCode.INJURY;
  }
  if (lower.includes('heat') || lower.includes('sun') || lower.includes('उष्माघात')) {
    return EmergencyCode.HEATSTROKE;
  }
  if (lower.includes('lost') || lower.includes('separated') || lower.includes('हरवले')) {
    return EmergencyCode.LOST_SEPARATED;
  }
  if (lower.includes('unwell') || lower.includes('dizz') || lower.includes('अस्वस्थ') || lower.includes('चक्कर')) {
    return EmergencyCode.FEELING_UNWELL;
  }
  if (lower.includes('assist') || lower.includes('help') || lower.includes('मदत') || lower.includes('सहायता')) {
    return EmergencyCode.NEED_ASSISTANCE;
  }
  return EmergencyCode.OTHER;
}

/**
 * Map an EmergencyCode back to a human-readable problem type
 */
export function codeToEmergencyLabel(code: EmergencyCode): string {
  switch (code) {
    case EmergencyCode.MEDICAL: return 'Medical Emergency';
    case EmergencyCode.INJURY: return 'Injury / Wound';
    case EmergencyCode.HEATSTROKE: return 'Heatstroke / Sun Exposure';
    case EmergencyCode.LOST_SEPARATED: return 'Lost / Separated from Dindi';
    case EmergencyCode.FEELING_UNWELL: return 'Feeling Unwell / Dizziness';
    case EmergencyCode.NEED_ASSISTANCE: return 'Need Physical Assistance';
    case EmergencyCode.OTHER: return 'Other Emergency';
    default: return 'Emergency';
  }
}

/**
 * Encode a BleSosPacket into a compact JSON string for BLE transmission.
 * Uses short keys to minimize byte size.
 */
export function encodeSosPacket(packet: BleSosPacket): string {
  const compact = {
    m: packet.msgId,
    c: packet.cardId,
    n: packet.pilgrimName.slice(0, 30), // Truncate name to save bytes
    ph: packet.pilgrimPhone,
    t: packet.emergencyType,
    p: packet.problemType.slice(0, 40),
    la: Math.round(packet.latitude * 100000),  // 5-decimal precision (~1.1m accuracy)
    lo: Math.round(packet.longitude * 100000),
    tt: packet.ttl,
    bg: BLOOD_GROUP_MAP[packet.bloodGroup] || 0,
    a: packet.age,
    s: packet.severity === 'critical' ? 2 : packet.severity === 'moderate' ? 1 : 0,
    mc: packet.medicalContext.slice(0, 80),
    d: packet.dindiName.slice(0, 40),
    ts: packet.timestamp,
  };

  return JSON.stringify(compact);
}

/**
 * Decode a compact JSON string back into a BleSosPacket.
 * Returns null if parsing fails.
 */
export function decodeSosPacket(raw: string): BleSosPacket | null {
  try {
    const c = JSON.parse(raw);
    return {
      msgId: c.m || '',
      cardId: c.c || '',
      pilgrimName: c.n || 'Unknown Pilgrim',
      pilgrimPhone: c.ph || '',
      emergencyType: c.t || EmergencyCode.OTHER,
      problemType: c.p || codeToEmergencyLabel(c.t || EmergencyCode.OTHER),
      latitude: (c.la || 0) / 100000,
      longitude: (c.lo || 0) / 100000,
      ttl: c.tt ?? 0,
      bloodGroup: BLOOD_GROUP_REVERSE[c.bg] || 'Unknown',
      age: c.a || 0,
      severity: c.s === 2 ? 'critical' : c.s === 1 ? 'moderate' : 'normal',
      medicalContext: c.mc || '',
      dindiName: c.d || '',
      timestamp: c.ts || Math.floor(Date.now() / 1000),
    };
  } catch (err) {
    console.error('[BLE Mesh] Failed to decode SOS packet:', err);
    return null;
  }
}

/**
 * Encode an ACK packet into compact JSON
 */
export function encodeAckPacket(ack: BleAckPacket): string {
  return JSON.stringify({
    m: ack.msgId,
    vn: ack.volunteerName.slice(0, 30),
    vp: ack.volunteerPhone,
    ts: ack.timestamp,
  });
}

/**
 * Decode an ACK packet from compact JSON
 */
export function decodeAckPacket(raw: string): BleAckPacket | null {
  try {
    const c = JSON.parse(raw);
    return {
      msgId: c.m || '',
      volunteerName: c.vn || 'Volunteer',
      volunteerPhone: c.vp || '',
      timestamp: c.ts || Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

/**
 * Approximate distance in meters from BLE signal strength (RSSI).
 * Uses standard path-loss model for 2.4 GHz Bluetooth.
 *
 * @param rssi - Measured signal strength in dBm (e.g. -65)
 * @param txPower - Broadcast power at 1 meter distance (default: -59 dBm)
 */
export function estimateDistanceFromRssi(rssi: number, txPower: number = -59): number {
  if (rssi === 0) return -1;

  const ratio = rssi / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  }
  // Standard path-loss formula for 2.4 GHz Bluetooth
  return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
}

/**
 * Calculate distance (meters) and bearing (degrees) between two GPS coordinates.
 * Uses the Haversine formula. Works completely offline.
 */
export function getDistanceAndBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): { distanceMeters: number; bearingDegrees: number; compassDirection: string } {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δφ = ((toLat - fromLat) * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.round(R * c);

  // Bearing angle (0° = North, 90° = East, 180° = South, 270° = West)
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearingDegrees = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

  // Compass direction label
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const compassDirection = directions[Math.round(bearingDegrees / 45) % 8];

  return { distanceMeters, bearingDegrees, compassDirection };
}

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'variraksha.db';
const WEB_STORAGE_KEY = 'variraksha_ble_sos_queue';

// In-memory fallback for environments without SQLite/localStorage
let inMemoryQueue: any[] = [];

/**
 * Helper to get web storage queue
 */
const getWebQueue = (): any[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(WEB_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return inMemoryQueue;
    }
  }
  return inMemoryQueue;
};

/**
 * Helper to save web storage queue
 */
const saveWebQueue = (queue: any[]): void => {
  inMemoryQueue = queue;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore web storage quota errors
    }
  }
};

/**
 * Placeholder SQLite connection helper.
 * Provides access to local offline-first SQLite database on mobile native platforms,
 * with web compatibility guard for web testing.
 */
export const getDatabase = async () => {
  if (Platform.OS === 'web') {
    return {
      databaseName: DATABASE_NAME,
      execAsync: async () => {},
      runAsync: async () => {},
      getAllAsync: async () => [],
    } as unknown as SQLite.SQLiteDatabase;
  }
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
};

export const initLocalDatabase = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('[SQLite] Local database helper initialized (Web fallback storage active)');
    return;
  }

  try {
    const db = await getDatabase();

    // Create offline BLE SOS queue table for persisting SOS alerts
    // that need to be broadcast via Bluetooth mesh and later synced to Supabase
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ble_sos_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        msg_id TEXT UNIQUE NOT NULL,
        card_id TEXT NOT NULL,
        pilgrim_name TEXT NOT NULL,
        pilgrim_phone TEXT,
        emergency_type INTEGER,
        problem_type TEXT,
        latitude REAL,
        longitude REAL,
        ttl INTEGER DEFAULT 5,
        blood_group TEXT,
        age INTEGER,
        severity TEXT DEFAULT 'critical',
        medical_context TEXT,
        dindi_name TEXT,
        timestamp INTEGER,
        payload_json TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0,
        is_broadcasting INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    console.log('[SQLite] Local database initialized with BLE SOS queue:', DATABASE_NAME);
  } catch (err) {
    console.warn('[SQLite] Database init error (falling back to memory):', err);
  }
};

// ─── Offline BLE SOS Queue Operations ───

/**
 * Insert a new offline SOS alert into the BLE queue
 */
export const insertOfflineSos = async (
  msgId: string,
  cardId: string,
  pilgrimName: string,
  pilgrimPhone: string,
  problemType: string,
  latitude: number,
  longitude: number,
  severity: string,
  payloadJson: string,
): Promise<void> => {
  const item = {
    msg_id: msgId,
    card_id: cardId,
    pilgrim_name: pilgrimName,
    pilgrim_phone: pilgrimPhone,
    problem_type: problemType,
    latitude,
    longitude,
    severity,
    payload_json: payloadJson,
    timestamp: Math.floor(Date.now() / 1000),
    is_synced: 0,
    is_broadcasting: 1,
    created_at: new Date().toISOString(),
  };

  if (Platform.OS === 'web') {
    const queue = getWebQueue();
    const existingIdx = queue.findIndex((q) => q.msg_id === msgId);
    if (existingIdx >= 0) {
      queue[existingIdx] = { ...queue[existingIdx], ...item };
    } else {
      queue.unshift(item);
    }
    saveWebQueue(queue);
    console.log('[SQLite/Web] Offline SOS saved to queue:', msgId);
    return;
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO ble_sos_queue 
       (msg_id, card_id, pilgrim_name, pilgrim_phone, problem_type, latitude, longitude, severity, payload_json, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [msgId, cardId, pilgrimName, pilgrimPhone, problemType, latitude, longitude, severity, payloadJson, Math.floor(Date.now() / 1000)],
    );
    console.log('[SQLite] Offline SOS saved to queue:', msgId);
  } catch (err) {
    console.warn('[SQLite] Fallback saving offline SOS to memory:', err);
    const queue = getWebQueue();
    queue.unshift(item);
    saveWebQueue(queue);
  }
};

/**
 * Get all pending (unsynced) offline SOS alerts
 */
export const getPendingOfflineSos = async (): Promise<any[]> => {
  if (Platform.OS === 'web') {
    const queue = getWebQueue();
    return queue.filter((item) => Number(item.is_synced) === 0);
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM ble_sos_queue WHERE is_synced = 0 ORDER BY created_at DESC',
    );
    return results || [];
  } catch (err) {
    console.warn('[SQLite] Error reading pending offline SOS, checking fallback queue:', err);
    const queue = getWebQueue();
    return queue.filter((item) => Number(item.is_synced) === 0);
  }
};

/**
 * Mark an offline SOS alert as synced (uploaded to Supabase)
 */
export const markSosSynced = async (msgId: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const queue = getWebQueue();
    const updated = queue.map((item) =>
      item.msg_id === msgId ? { ...item, is_synced: 1 } : item,
    );
    saveWebQueue(updated);
    console.log('[SQLite/Web] Offline SOS marked as synced:', msgId);
    return;
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE ble_sos_queue SET is_synced = 1 WHERE msg_id = ?',
      [msgId],
    );
    console.log('[SQLite] Offline SOS marked as synced:', msgId);
  } catch (err) {
    console.warn('[SQLite] Error marking synced, updating fallback queue:', err);
    const queue = getWebQueue();
    const updated = queue.map((item) =>
      item.msg_id === msgId ? { ...item, is_synced: 1 } : item,
    );
    saveWebQueue(updated);
  }
};

/**
 * Mark an offline SOS alert as actively broadcasting via BLE
 */
export const markSosBroadcasting = async (msgId: string, broadcasting: boolean): Promise<void> => {
  if (Platform.OS === 'web') {
    const queue = getWebQueue();
    const updated = queue.map((item) =>
      item.msg_id === msgId ? { ...item, is_broadcasting: broadcasting ? 1 : 0 } : item,
    );
    saveWebQueue(updated);
    return;
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE ble_sos_queue SET is_broadcasting = ? WHERE msg_id = ?',
      [broadcasting ? 1 : 0, msgId],
    );
  } catch (err) {
    console.warn('[SQLite] Error updating broadcasting flag:', err);
  }
};

export default {
  getDatabase,
  initLocalDatabase,
  insertOfflineSos,
  getPendingOfflineSos,
  markSosSynced,
  markSosBroadcasting,
};

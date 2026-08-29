import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'variraksha.db';

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
    console.log('[SQLite] Local database helper initialized (Web fallback mode)');
    return;
  }
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
  if (Platform.OS === 'web') return;

  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ble_sos_queue 
     (msg_id, card_id, pilgrim_name, pilgrim_phone, problem_type, latitude, longitude, severity, payload_json, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [msgId, cardId, pilgrimName, pilgrimPhone, problemType, latitude, longitude, severity, payloadJson, Math.floor(Date.now() / 1000)],
  );
  console.log('[SQLite] Offline SOS saved to queue:', msgId);
};

/**
 * Get all pending (unsynced) offline SOS alerts
 */
export const getPendingOfflineSos = async (): Promise<any[]> => {
  if (Platform.OS === 'web') return [];

  const db = await getDatabase();
  const results = await db.getAllAsync(
    'SELECT * FROM ble_sos_queue WHERE is_synced = 0 ORDER BY created_at DESC',
  );
  return results;
};

/**
 * Mark an offline SOS alert as synced (uploaded to Supabase)
 */
export const markSosSynced = async (msgId: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  const db = await getDatabase();
  await db.runAsync(
    'UPDATE ble_sos_queue SET is_synced = 1 WHERE msg_id = ?',
    [msgId],
  );
  console.log('[SQLite] Offline SOS marked as synced:', msgId);
};

/**
 * Mark an offline SOS alert as actively broadcasting via BLE
 */
export const markSosBroadcasting = async (msgId: string, broadcasting: boolean): Promise<void> => {
  if (Platform.OS === 'web') return;

  const db = await getDatabase();
  await db.runAsync(
    'UPDATE ble_sos_queue SET is_broadcasting = ? WHERE msg_id = ?',
    [broadcasting ? 1 : 0, msgId],
  );
};

export default {
  getDatabase,
  initLocalDatabase,
  insertOfflineSos,
  getPendingOfflineSos,
  markSosSynced,
  markSosBroadcasting,
};

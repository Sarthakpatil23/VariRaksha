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
  await getDatabase();
  console.log('[SQLite] Local database helper initialized:', DATABASE_NAME);
};

export default {
  getDatabase,
  initLocalDatabase,
};

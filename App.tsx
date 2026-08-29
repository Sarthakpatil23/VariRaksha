import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './app/navigation/RootNavigator';
import './app/locales/i18n';
import { initLocalDatabase } from './app/lib/sqlite';
import { bleMeshManager } from './app/services/bleMeshManager';

export default function App() {
  useEffect(() => {
    // Initialize empty DB connection helper on startup
    initLocalDatabase().catch((err) => {
      console.error('[SQLite] Error initializing database connection helper:', err);
    });

    // Initialize BLE Mesh Manager (prepares Bluetooth adapter)
    bleMeshManager.initialize().then((ready) => {
      if (ready) {
        console.log('[BLE Mesh] Bluetooth adapter ready for mesh operations');
      } else {
        console.log('[BLE Mesh] Bluetooth not available or powered off');
      }
    }).catch((err) => {
      console.warn('[BLE Mesh] Initialization error (non-fatal):', err);
    });

    return () => {
      // Cleanup BLE resources on app unmount
      bleMeshManager.destroy();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

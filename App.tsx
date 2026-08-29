import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './app/navigation/RootNavigator';
import './app/locales/i18n';
import { initLocalDatabase } from './app/lib/sqlite';

export default function App() {
  useEffect(() => {
    // Initialize empty DB connection helper on startup
    initLocalDatabase().catch((err) => {
      console.error('[SQLite] Error initializing database connection helper:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

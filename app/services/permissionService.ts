import { useState, useEffect, useCallback } from 'react';
import {
  Platform,
  Linking,
  AppState,
  AppStateStatus,
  PermissionsAndroid,
} from 'react-native';
import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';

export type CapabilityState = 'enabled' | 'required' | 'denied' | 'permanently_denied' | 'unavailable';

export interface DevicePermissionsStatus {
  location: {
    state: CapabilityState;
    permissionGranted: boolean;
    servicesEnabled: boolean;
    canAskAgain: boolean;
    details?: string;
  };
  bluetooth: {
    state: CapabilityState;
    permissionGranted: boolean;
    canAskAgain: boolean;
    details?: string;
  };
  allReady: boolean;
}

// In-memory flag for Bluetooth activation state across the session
let globalBluetoothActive = false;

export function setGlobalBluetoothState(enabled: boolean) {
  globalBluetoothActive = enabled;
}

export function getGlobalBluetoothState(): boolean {
  return globalBluetoothActive;
}

/**
 * Check location permissions and device GPS services status
 */
export async function checkLocationCapability(): Promise<{
  state: CapabilityState;
  permissionGranted: boolean;
  servicesEnabled: boolean;
  canAskAgain: boolean;
  details?: string;
}> {
  if (Platform.OS === 'web') {
    try {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        if ('permissions' in navigator && navigator.permissions.query) {
          const queryRes = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (queryRes.state === 'granted') {
            return {
              state: 'enabled',
              permissionGranted: true,
              servicesEnabled: true,
              canAskAgain: true,
            };
          } else if (queryRes.state === 'denied') {
            return {
              state: 'permanently_denied',
              permissionGranted: false,
              servicesEnabled: true,
              canAskAgain: false,
              details: 'Location blocked in browser settings',
            };
          }
        }
        return {
          state: 'required',
          permissionGranted: false,
          servicesEnabled: true,
          canAskAgain: true,
        };
      }
      return {
        state: 'unavailable',
        permissionGranted: false,
        servicesEnabled: false,
        canAskAgain: false,
        details: 'Geolocation not supported by browser',
      };
    } catch {
      return {
        state: 'required',
        permissionGranted: false,
        servicesEnabled: true,
        canAskAgain: true,
      };
    }
  }

  try {
    const isServiceEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
    const perm = await Location.getForegroundPermissionsAsync();

    const isGranted = perm.granted || perm.status === Location.PermissionStatus.GRANTED;
    const canAskAgain = perm.canAskAgain !== false;

    if (isGranted) {
      if (!isServiceEnabled) {
        return {
          state: 'required',
          permissionGranted: true,
          servicesEnabled: false,
          canAskAgain: true,
          details: 'Device GPS is turned off. Please turn on Location in quick settings.',
        };
      }
      return {
        state: 'enabled',
        permissionGranted: true,
        servicesEnabled: true,
        canAskAgain: true,
      };
    }

    if (perm.status === Location.PermissionStatus.DENIED) {
      return {
        state: canAskAgain ? 'denied' : 'permanently_denied',
        permissionGranted: false,
        servicesEnabled: isServiceEnabled,
        canAskAgain,
        details: canAskAgain ? 'Permission denied' : 'Permanently denied in app settings',
      };
    }

    return {
      state: 'required',
      permissionGranted: false,
      servicesEnabled: isServiceEnabled,
      canAskAgain: true,
    };
  } catch (err: any) {
    console.warn('[PermissionService] Error checking location:', err);
    return {
      state: 'required',
      permissionGranted: false,
      servicesEnabled: true,
      canAskAgain: true,
      details: err.message,
    };
  }
}

/**
 * Request location permissions and trigger system dialog
 */
export async function requestLocationCapability(): Promise<{
  granted: boolean;
  state: CapabilityState;
}> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        return { granted: true, state: 'enabled' };
      } catch (err: any) {
        if (err.code === 1) {
          return { granted: false, state: 'permanently_denied' };
        }
        return { granted: false, state: 'denied' };
      }
    }
    return { granted: false, state: 'unavailable' };
  }

  try {
    const res = await Location.requestForegroundPermissionsAsync();
    const isGranted = res.granted || res.status === Location.PermissionStatus.GRANTED;

    if (isGranted) {
      const isServiceEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!isServiceEnabled) {
        // Open Location Source Settings if GPS switch is off
        await openLocationSettings();
        return { granted: false, state: 'required' };
      }
      return { granted: true, state: 'enabled' };
    }

    if (res.canAskAgain === false) {
      return { granted: false, state: 'permanently_denied' };
    }
    return { granted: false, state: 'denied' };
  } catch (err: any) {
    console.warn('[PermissionService] Error requesting location:', err);
    return { granted: false, state: 'denied' };
  }
}

/**
 * Check Bluetooth capability and status
 */
export async function checkBluetoothCapability(): Promise<{
  state: CapabilityState;
  permissionGranted: boolean;
  canAskAgain: boolean;
  details?: string;
}> {
  if (globalBluetoothActive) {
    return {
      state: 'enabled',
      permissionGranted: true,
      canAskAgain: true,
    };
  }

  if (Platform.OS === 'web') {
    return {
      state: globalBluetoothActive ? 'enabled' : 'required',
      permissionGranted: globalBluetoothActive,
      canAskAgain: true,
    };
  }

  if (Platform.OS === 'android') {
    try {
      // Check if runtime permissions exist
      if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
        const scanOk = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        ).catch(() => false);
        const connectOk = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ).catch(() => false);

        if (scanOk && connectOk) {
          globalBluetoothActive = true;
          return {
            state: 'enabled',
            permissionGranted: true,
            canAskAgain: true,
          };
        }
      }

      // Check fine location (used by Android for BLE beacon scanning)
      const fineLocationOk = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).catch(() => false);

      if (fineLocationOk && globalBluetoothActive) {
        return {
          state: 'enabled',
          permissionGranted: true,
          canAskAgain: true,
        };
      }

      return {
        state: globalBluetoothActive ? 'enabled' : 'required',
        permissionGranted: globalBluetoothActive,
        canAskAgain: true,
      };
    } catch {
      return {
        state: globalBluetoothActive ? 'enabled' : 'required',
        permissionGranted: globalBluetoothActive,
        canAskAgain: true,
      };
    }
  }

  return {
    state: 'enabled',
    permissionGranted: true,
    canAskAgain: true,
  };
}

/**
 * Request Bluetooth capability or trigger native Android Bluetooth turn-on prompt
 */
export async function requestBluetoothCapability(): Promise<{
  granted: boolean;
  state: CapabilityState;
}> {
  if (Platform.OS === 'android') {
    try {
      // 1. Try native Android OS popup to turn on device Bluetooth hardware:
      // "An app wants to turn on Bluetooth -> [Allow] [Deny]"
      const result = await IntentLauncher.startActivityAsync(
        'android.bluetooth.adapter.action.REQUEST_ENABLE',
      );

      // Result code -1 is Activity.RESULT_OK (User pressed Allow)
      if (result && result.resultCode === -1) {
        globalBluetoothActive = true;
        return { granted: true, state: 'enabled' };
      }

      // If user denied the prompt, result is 0
      if (result && result.resultCode === 0) {
        // Fallback: Open Bluetooth settings so user can turn on hardware switch
        await openBluetoothSettings();
        globalBluetoothActive = true;
        return { granted: true, state: 'enabled' };
      }
    } catch (intentErr) {
      console.log('[PermissionService] REQUEST_ENABLE intent not supported, opening settings:', intentErr);
      try {
        await openBluetoothSettings();
        globalBluetoothActive = true;
        return { granted: true, state: 'enabled' };
      } catch {
        globalBluetoothActive = true;
        return { granted: true, state: 'enabled' };
      }
    }
  }

  globalBluetoothActive = true;
  return { granted: true, state: 'enabled' };
}

/**
 * Open native Bluetooth Settings on Android
 */
export async function openBluetoothSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS,
      );
      return;
    } catch {
      try {
        await Linking.openSettings();
      } catch (err) {
        console.warn('Could not open Bluetooth settings:', err);
      }
    }
  } else {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('Could not open settings:', err);
    }
  }
}

/**
 * Open native Location / GPS Settings on Android
 */
export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
      );
      return;
    } catch {
      try {
        await Linking.openSettings();
      } catch (err) {
        console.warn('Could not open Location settings:', err);
      }
    }
  } else {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('Could not open settings:', err);
    }
  }
}

/**
 * Open general app settings
 */
export async function openDeviceAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (err) {
    console.warn('[PermissionService] Could not open app settings:', err);
  }
}

/**
 * Check both Bluetooth and Location together
 */
export async function checkAllDevicePermissions(): Promise<DevicePermissionsStatus> {
  const [locRes, btRes] = await Promise.all([
    checkLocationCapability(),
    checkBluetoothCapability(),
  ]);

  const allReady = locRes.state === 'enabled' && btRes.state === 'enabled';

  return {
    location: locRes,
    bluetooth: btRes,
    allReady,
  };
}

/**
 * React Hook for real-time permission state & AppState observation
 */
export function useDevicePermissions() {
  const [status, setStatus] = useState<DevicePermissionsStatus>({
    location: {
      state: 'required',
      permissionGranted: false,
      servicesEnabled: true,
      canAskAgain: true,
    },
    bluetooth: {
      state: globalBluetoothActive ? 'enabled' : 'required',
      permissionGranted: globalBluetoothActive,
      canAskAgain: true,
    },
    allReady: false,
  });
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const refreshPermissions = useCallback(async () => {
    setIsChecking(true);
    const freshStatus = await checkAllDevicePermissions();
    setStatus(freshStatus);
    setIsChecking(false);
    return freshStatus;
  }, []);

  const toggleBluetoothManual = useCallback(async (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !globalBluetoothActive;
    globalBluetoothActive = nextState;
    return refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    refreshPermissions();

    // Re-check permissions when returning from Phone Settings
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPermissions]);

  const requestLocation = async () => {
    await requestLocationCapability();
    return refreshPermissions();
  };

  const requestBluetooth = async () => {
    await requestBluetoothCapability();
    return refreshPermissions();
  };

  const requestAll = async () => {
    await requestLocationCapability();
    await requestBluetoothCapability();
    return refreshPermissions();
  };

  return {
    status,
    isChecking,
    refreshPermissions,
    requestLocation,
    requestBluetooth,
    requestAll,
    toggleBluetoothManual,
    openBluetoothSettings,
    openLocationSettings,
    openSettings: openDeviceAppSettings,
  };
}

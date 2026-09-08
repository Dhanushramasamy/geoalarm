import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { registerPlugin } from '@capacitor/core';
import { GPSCoordinates, TargetLocation, AppPermissionState } from './types';
import { calculateHaversineDistance, isWithinRadius, isValidGPSAccuracy, ConsecutiveFixVerifier } from './distance';

// Dynamic reference for background geolocation native plugin
let BackgroundGeolocation: any = null;
if (Capacitor.isNativePlatform()) {
  try {
    BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
  } catch (e) {
    console.warn('BackgroundGeolocation plugin not available natively:', e);
  }
}

export interface LocationWatcherCallbacks {
  onLocationUpdate: (current: GPSCoordinates, distanceMeters: number) => void;
  onTargetReached: (current: GPSCoordinates, distanceMeters: number) => void;
  onError: (errorMsg: string) => void;
}

export class LocationService {
  private static watchId: string | number | null = null;
  private static fixVerifier: ConsecutiveFixVerifier = new ConsecutiveFixVerifier(2);
  private static isSimulating: boolean = false;

  /**
   * Checks current permission status for location & notifications
   */
  public static async checkPermissions(): Promise<AppPermissionState> {
    if (Capacitor.isNativePlatform()) {
      try {
        const geoStatus = await Geolocation.checkPermissions();
        const locState = geoStatus.location === 'granted' ? 'granted' : 'denied';
        const bgState = geoStatus.coarseLocation === 'granted' || geoStatus.location === 'granted' ? 'granted' : 'prompt';

        return {
          location: locState,
          backgroundLocation: bgState,
          notifications: 'granted',
        };
      } catch (err) {
        console.warn('Permission check failed:', err);
      }
    }

    if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      return {
        location: 'granted',
        backgroundLocation: 'prompt',
        notifications: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'granted' : 'prompt',
      };
    }

    return {
      location: 'denied',
      backgroundLocation: 'denied',
      notifications: 'denied',
    };
  }

  /**
   * Requests necessary location permissions
   */
  public static async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Geolocation.requestPermissions();
        return result.location === 'granted';
      } catch (err) {
        console.warn('Geolocation requestPermissions error:', err);
        return false;
      }
    }
    return true; // Web browser permission is prompted on watchPosition call
  }

  /**
   * Fetches single current location fix
   */
  public static async getCurrentLocation(): Promise<GPSCoordinates> {
    if (Capacitor.isNativePlatform()) {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
      } catch (err) {
        console.warn('Native getCurrentPosition failed, using fallback:', err);
      }
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            timestamp: pos.timestamp,
          });
        },
        (err) => reject(new Error(`Location error: ${err.message}`)),
        {
          enableHighAccuracy: true,
          timeout: 15000,
        }
      );
    });
  }

  /**
   * Starts monitoring journey location in background/foreground
   */
  public static async startMonitoring(
    target: TargetLocation,
    callbacks: LocationWatcherCallbacks
  ): Promise<void> {
    await this.stopMonitoring();
    this.fixVerifier.reset();

    const processLocationFix = (currentFix: GPSCoordinates) => {
      // Filter noisy GPS reading
      if (!isValidGPSAccuracy(currentFix, 150)) {
        console.log('Skipping low-accuracy GPS fix:', currentFix.accuracy);
        return;
      }

      const distance = calculateHaversineDistance(currentFix, target);
      callbacks.onLocationUpdate(currentFix, distance);

      const insideRadius = isWithinRadius(currentFix, target, target.radiusMeters);
      const isConfirmed = this.fixVerifier.registerFix(insideRadius);

      if (isConfirmed) {
        callbacks.onTargetReached(currentFix, distance);
      }
    };

    // 1. Native Background Geolocation if available
    if (Capacitor.isNativePlatform() && BackgroundGeolocation) {
      try {
        this.watchId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'GeoAlarm is tracking your train journey location to wake you up on time.',
            backgroundTitle: 'Journey Monitoring Active',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          (location: any, error: any) => {
            if (error) {
              callbacks.onError(`Background location error: ${error.message || 'Unknown'}`);
              return;
            }
            if (location) {
              processLocationFix({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: Date.now(),
              });
            }
          }
        );
        return;
      } catch (err) {
        console.warn('BackgroundGeolocation plugin watcher failed, falling back to Geolocation watchPosition:', err);
      }
    }

    // 2. Capacitor Standard Geolocation Watcher / Web Fallback
    if (Capacitor.isNativePlatform()) {
      try {
        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000,
          },
          (position, err) => {
            if (err) {
              callbacks.onError(`Geolocation watcher error: ${err.message}`);
              return;
            }
            if (position) {
              processLocationFix({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              });
            }
          }
        );
        this.watchId = id;
        return;
      } catch (err) {
        console.warn('Native watchPosition failed:', err);
      }
    }

    // 3. Web Browser Geolocation API
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          processLocationFix({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            timestamp: pos.timestamp,
          });
        },
        (err) => callbacks.onError(`Browser location error: ${err.message}`),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        }
      );
      this.watchId = id;
    } else {
      callbacks.onError('Geolocation API unavailable on this device.');
    }
  }

  /**
   * Stops active location watcher
   */
  public static async stopMonitoring(): Promise<void> {
    if (this.watchId !== null) {
      if (Capacitor.isNativePlatform() && BackgroundGeolocation && typeof this.watchId === 'string') {
        try {
          await BackgroundGeolocation.removeWatcher({ id: this.watchId });
        } catch (e) {
          // Ignore removal error
        }
      } else if (Capacitor.isNativePlatform() && typeof this.watchId === 'string') {
        try {
          await Geolocation.clearWatch({ id: this.watchId });
        } catch (e) {
          // Ignore
        }
      } else if (typeof window !== 'undefined' && typeof this.watchId === 'number') {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = null;
    }
  }

  /**
   * Simulated GPS coordinate update for developer testing
   */
  public static simulateLocationUpdate(
    simulatedCoords: GPSCoordinates,
    target: TargetLocation,
    callbacks: LocationWatcherCallbacks
  ): void {
    const distance = calculateHaversineDistance(simulatedCoords, target);
    callbacks.onLocationUpdate(simulatedCoords, distance);

    const insideRadius = isWithinRadius(simulatedCoords, target, target.radiusMeters);
    const isConfirmed = this.fixVerifier.registerFix(insideRadius);

    if (isConfirmed || insideRadius) {
      callbacks.onTargetReached(simulatedCoords, distance);
    }
  }
}

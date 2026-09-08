import { GPSCoordinates, TargetLocation } from './types';

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Checks if current GPS coordinates fall within the specified target radius.
 */
export function isWithinRadius(
  current: GPSCoordinates,
  target: { latitude: number; longitude: number },
  radiusMeters: number
): boolean {
  const distance = calculateHaversineDistance(current, target);
  return distance <= radiusMeters;
}

/**
 * Validates GPS fix accuracy to reject noisy readings.
 * Returns true if accuracy reading is reliable (or missing/unspecified).
 */
export function isValidGPSAccuracy(
  current: GPSCoordinates,
  maxAllowedAccuracyMeters = 150
): boolean {
  if (current.accuracy === undefined || current.accuracy === null) {
    return true;
  }
  return current.accuracy <= maxAllowedAccuracyMeters;
}

/**
 * Helper class to prevent false triggers from a single bad GPS spike.
 * Requires N consecutive readings within radius to confirm arrival.
 */
export class ConsecutiveFixVerifier {
  private requiredFixes: number;
  private consecutiveCount: number = 0;

  constructor(requiredFixes = 2) {
    this.requiredFixes = requiredFixes;
  }

  public registerFix(isInside: boolean): boolean {
    if (isInside) {
      this.consecutiveCount++;
      return this.consecutiveCount >= this.requiredFixes;
    } else {
      this.consecutiveCount = 0;
      return false;
    }
  }

  public reset(): void {
    this.consecutiveCount = 0;
  }
}

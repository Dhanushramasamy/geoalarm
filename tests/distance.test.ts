import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  isWithinRadius,
  isValidGPSAccuracy,
  ConsecutiveFixVerifier,
} from '../lib/location/distance';

describe('Location Distance & Geofencing Math', () => {
  // Known coordinates:
  // Bengaluru City Station (12.9784, 77.5684)
  // Yesvantpur Station (13.0238, 77.5504) -> approx 5.4 km apart
  const bengaluruStation = { latitude: 12.9784, longitude: 77.5684 };
  const yesvantpurStation = { latitude: 13.0238, longitude: 77.5504 };

  it('calculates accurate Haversine distance in meters', () => {
    const distanceMeters = calculateHaversineDistance(bengaluruStation, yesvantpurStation);
    expect(distanceMeters).toBeGreaterThan(5000);
    expect(distanceMeters).toBeLessThan(6000);
  });

  it('returns 0 meters for identical coordinates', () => {
    const distance = calculateHaversineDistance(bengaluruStation, bengaluruStation);
    expect(distance).toBe(0);
  });

  it('correctly evaluates isWithinRadius', () => {
    const nearFix = { latitude: 12.9790, longitude: 77.5688 }; // ~80m away
    const farFix = { latitude: 13.0500, longitude: 77.6000 }; // >8km away

    expect(isWithinRadius(nearFix, bengaluruStation, 1000)).toBe(true);
    expect(isWithinRadius(farFix, bengaluruStation, 1000)).toBe(false);
  });

  it('filters out noisy GPS fixes with poor accuracy', () => {
    const accurateFix = { latitude: 12.9784, longitude: 77.5684, accuracy: 15 };
    const noisyFix = { latitude: 12.9784, longitude: 77.5684, accuracy: 250 };

    expect(isValidGPSAccuracy(accurateFix, 150)).toBe(true);
    expect(isValidGPSAccuracy(noisyFix, 150)).toBe(false);
  });

  it('requires consecutive valid fixes before confirming target arrival', () => {
    const verifier = new ConsecutiveFixVerifier(2);

    // First fix inside radius -> returns false (needs 2 consecutive)
    expect(verifier.registerFix(true)).toBe(false);

    // Second fix inside radius -> returns true!
    expect(verifier.registerFix(true)).toBe(true);

    // Fix outside resets counter
    expect(verifier.registerFix(false)).toBe(false);
    expect(verifier.registerFix(true)).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { JourneyStore } from '../lib/journey/journey-store';
import { JourneyState } from '../lib/journey/types';

describe('JourneyStore local state management', () => {
  beforeEach(async () => {
    await JourneyStore.clearActiveJourney();
  });

  it('saves and retrieves active journey state', async () => {
    const mockJourney: JourneyState = {
      id: 'test-1',
      targetName: 'Bengaluru City Station',
      targetLatitude: 12.9784,
      targetLongitude: 77.5684,
      radiusMeters: 1000,
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    await JourneyStore.saveActiveJourney(mockJourney);
    const retrieved = await JourneyStore.getActiveJourney();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.targetName).toBe('Bengaluru City Station');
    expect(retrieved?.status).toBe('active');
  });

  it('updates journey status to triggered', async () => {
    const mockJourney: JourneyState = {
      id: 'test-2',
      targetName: 'Yesvantpur Station',
      targetLatitude: 13.0238,
      targetLongitude: 77.5504,
      radiusMeters: 2000,
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    await JourneyStore.saveActiveJourney(mockJourney);
    const updated = await JourneyStore.updateJourneyStatus('triggered');

    expect(updated?.status).toBe('triggered');
    expect(updated?.triggeredAt).toBeDefined();
  });

  it('clears active journey', async () => {
    const mockJourney: JourneyState = {
      id: 'test-3',
      targetName: 'Chennai Central',
      targetLatitude: 13.0827,
      targetLongitude: 80.2757,
      radiusMeters: 1000,
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    await JourneyStore.saveActiveJourney(mockJourney);
    await JourneyStore.clearActiveJourney();

    const retrieved = await JourneyStore.getActiveJourney();
    expect(retrieved).toBeNull();
  });
});

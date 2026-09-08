import { Preferences } from '@capacitor/preferences';
import { JourneyState, JourneyStatus } from './types';

const ACTIVE_JOURNEY_KEY = 'geoalarm_active_journey';
const DRAFT_JOURNEY_KEY = 'geoalarm_draft_journey';

// In-memory fallback map for Node/testing environments
const memoryStore = new Map<string, string>();

export class JourneyStore {
  /**
   * Retrieves the active journey from local storage
   */
  public static async getActiveJourney(): Promise<JourneyState | null> {
    try {
      const { value } = await Preferences.get({ key: ACTIVE_JOURNEY_KEY });
      if (value) {
        return JSON.parse(value) as JourneyState;
      }
    } catch {
      // Fallback
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(ACTIVE_JOURNEY_KEY);
      if (raw) return JSON.parse(raw) as JourneyState;
    }

    const mem = memoryStore.get(ACTIVE_JOURNEY_KEY);
    if (mem) return JSON.parse(mem) as JourneyState;

    return null;
  }

  /**
   * Saves or updates the active journey
   */
  public static async saveActiveJourney(journey: JourneyState): Promise<void> {
    const serialized = JSON.stringify(journey);
    memoryStore.set(ACTIVE_JOURNEY_KEY, serialized);
    try {
      await Preferences.set({ key: ACTIVE_JOURNEY_KEY, value: serialized });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACTIVE_JOURNEY_KEY, serialized);
      }
    }
  }

  /**
   * Updates status of the active journey
   */
  public static async updateJourneyStatus(
    status: JourneyStatus,
    triggeredAt?: string
  ): Promise<JourneyState | null> {
    const current = await this.getActiveJourney();
    if (!current) return null;

    const updated: JourneyState = {
      ...current,
      status,
      triggeredAt: triggeredAt || (status === 'triggered' ? new Date().toISOString() : current.triggeredAt),
    };

    await this.saveActiveJourney(updated);
    return updated;
  }

  /**
   * Clears/removes the active journey
   */
  public static async clearActiveJourney(): Promise<void> {
    memoryStore.delete(ACTIVE_JOURNEY_KEY);
    try {
      await Preferences.remove({ key: ACTIVE_JOURNEY_KEY });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_JOURNEY_KEY);
      }
    }
  }

  /**
   * Saves draft target location choices before journey start
   */
  public static async saveDraftJourney(journey: Partial<JourneyState>): Promise<void> {
    const serialized = JSON.stringify(journey);
    memoryStore.set(DRAFT_JOURNEY_KEY, serialized);
    try {
      await Preferences.set({ key: DRAFT_JOURNEY_KEY, value: serialized });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DRAFT_JOURNEY_KEY, serialized);
      }
    }
  }

  public static async getDraftJourney(): Promise<Partial<JourneyState> | null> {
    try {
      const { value } = await Preferences.get({ key: DRAFT_JOURNEY_KEY });
      if (value) return JSON.parse(value);
    } catch {
      // Fallback
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DRAFT_JOURNEY_KEY);
      if (raw) return JSON.parse(raw);
    }

    const mem = memoryStore.get(DRAFT_JOURNEY_KEY);
    if (mem) return JSON.parse(mem);

    return null;
  }
}

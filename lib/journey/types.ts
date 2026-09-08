export type JourneyStatus = 'draft' | 'active' | 'triggered' | 'cancelled';

export interface JourneyState {
  id: string;
  targetName: string;
  targetLatitude: number;
  targetLongitude: number;
  radiusMeters: number;
  status: JourneyStatus;
  startedAt: string;
  triggeredAt?: string;
  initialDistanceMeters?: number;
  currentDistanceMeters?: number;
  lastGPSUpdate?: string;
}

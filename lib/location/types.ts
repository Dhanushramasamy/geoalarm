export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  timestamp?: number;
}

export interface TargetLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
  type?: string;
}

export type PermissionStatusType = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

export interface AppPermissionState {
  location: PermissionStatusType;
  backgroundLocation: PermissionStatusType;
  notifications: PermissionStatusType;
}

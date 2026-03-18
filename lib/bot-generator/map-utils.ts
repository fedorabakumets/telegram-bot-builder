/**
 * @fileoverview Map utilities - temporary stubs
 * TODO: Implement proper map utilities
 */

export interface LocationInfo {
  title?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CoordinateExtractionResult {
  coordinates: Coordinates | null;
  service: string;
}

/**
 * Temporary stub for extracting coordinates from URL
 */
export function extractCoordinatesFromUrl(url: string): CoordinateExtractionResult {
  // TODO: Implement coordinate extraction from various map services
  console.warn('extractCoordinatesFromUrl not implemented yet');
  return {
    coordinates: null,
    service: 'unknown'
  };
}

/**
 * Temporary stub for getting location info
 */
export async function getLocationInfo(latitude: number, longitude: number): Promise<LocationInfo | null> {
  // TODO: Implement reverse geocoding
  console.warn('getLocationInfo not implemented yet');
  return null;
}

/**
 * Temporary stub for formatting coordinates
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  // TODO: Implement proper coordinate formatting
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
import type { Booking, VisitLocation } from '../types';

export const NEARBY_RADIUS_KM = 5;

export interface NearbyVisit {
  visit: Booking;
  distanceKm: number | null; // null when matched by PIN code because a GPS location is missing
}

const isActiveHomeVisit = (b: Booking) =>
  b.visitType !== 'lab_visit' && !['cancelled', 'report_uploaded', 'completed'].includes(b.status);

// Straight-line distance (haversine formula)
const distanceBetweenKm = (a: VisitLocation, b: VisitLocation) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// Finds the closest other active home visit on the same date
export const findNearbyVisit = (booking: Booking, bookings: Booking[]): NearbyVisit | null => {
  if (!isActiveHomeVisit(booking)) return null;

  let nearest: NearbyVisit | null = null;
  for (const visit of bookings) {
    if (visit.id === booking.id || visit.appointmentDate !== booking.appointmentDate || !isActiveHomeVisit(visit)) continue;

    if (booking.visitLocation && visit.visitLocation) {
      const distanceKm = distanceBetweenKm(booking.visitLocation, visit.visitLocation);
      if (distanceKm <= NEARBY_RADIUS_KM && (nearest?.distanceKm == null || distanceKm < nearest.distanceKm)) {
        nearest = { visit, distanceKm };
      }
    } else if (!nearest && booking.visitPincode && booking.visitPincode === visit.visitPincode) {
      nearest = { visit, distanceKm: null };
    }
  }
  return nearest;
};

export type UserRole = 'patient' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  createdAt: string;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
}

export interface BloodTest {
  id: string;
  testName: string;
  category: string;
  description: string;
  preparationInstructions: string;
  basePrice: number;       // Visible only to Admin
  sellingPrice: number;    // Visible to Patients and Admins
  sampleType: string;      // e.g., Blood, Blood Serum
  reportTime: string;      // e.g., "24 Hours", "12 Hours"
  isActive: boolean;
  createdAt: string;
  pricing?: TestPricing;   // Added by the API, never stored
}

// Calculated by the server from the festival offer
export interface TestPricing {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

export interface FestivalOffer {
  name: string;
  generalDiscountPercent: number;
  testDiscounts: Record<string, number>; // testId -> percent, overrides the general discount
  startsAt: string;        // ISO timestamps
  endsAt: string;
  posterUpdatedAt: string | null; // null when there is no poster
  updatedAt: string;
}

// What patients see about the running offer
export interface ActiveOfferSummary {
  name: string;
  generalDiscountPercent: number;
  endsAt: string;
  posterUrl: string | null;
}

export type BookingStatus = 'pending' | 'confirmed' | 'sample_collected' | 'report_uploaded' | 'completed' | 'cancelled';

export interface VisitLocation {
  latitude: number;
  longitude: number;
  accuracy: number;        // Meters, as reported by the patient's device
  pinConfirmed?: boolean;  // Patient checked or moved the map pin before booking
}

export interface Booking {
  id: string;
  patientId: string;
  patientName: string;     // Utility helper
  patientEmail: string;    // Utility helper
  tests: {
    id: string;
    testName: string;
    sellingPrice: number;   // Price charged, after any discount
    basePrice?: number;     // If fetched by admin
    originalPrice?: number; // Set when a discount was applied
    discountPercent?: number;
  }[];
  totalAmount: number;
  offerName?: string;       // Festival offer applied at booking time
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  visitType?: 'home_visit' | 'lab_visit';
  contactPhone?: string;   // Home visits only
  visitAddress?: string;   // Home visits only
  visitArea?: string;      // Village or area name, shared in Telegram alerts
  visitPincode?: string;
  visitLandmark?: string;
  visitLocation?: VisitLocation; // Saved once at booking, not tracked afterwards
  createdAt: string;
}

export interface PatientReport {
  id: string;
  bookingId: string;
  patientId: string;
  patientName: string;
  uploadedBy: string; // admin user ID
  reportFileUrl: string; // File name or base64 data url for viewing/downloading
  reportFileName: string;
  uploadedAt: string;
}

export interface LabInfo {
  labName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  googleMapLink: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  frozenSlots?: string[];
  slotCapacities?: Record<string, number>; // Keyed like frozenSlots: "time" or "date_time"
}

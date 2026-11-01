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
    sellingPrice: number;
    basePrice?: number;     // If fetched by admin
  }[];
  totalAmount: number;
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  visitType?: 'home_visit' | 'lab_visit';
  contactPhone?: string;   // Home visits only
  visitAddress?: string;   // Home visits only
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
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, BloodTest, Booking, PatientReport, LabInfo } from '../../frontend/src/types';

export interface LocalDatabase {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed password
  tests: BloodTest[];
  bookings: Booking[];
  reports: PatientReport[];
  labInfo: LabInfo;
}

const DB_FILE = path.join(process.cwd(), 'db.json');

export const DEFAULT_LAB_INFO: LabInfo = {
  labName: 'Yadav Health Diagnostics',
  address: 'Yadav Labs Building, Plot No. 420, Sector 12, Dwarka, New Delhi, Pin - 110075',
  phone: '+91 98123 45678',
  email: 'contact@yadavhealth.com',
  openingHours: 'Mon - Sat: 07:00 AM - 09:00 PM, Sun: 07:00 AM - 02:00 PM',
  googleMapLink: 'https://maps.google.com/?q=Yadav+Health+Diagnostics,+Sector+12,+Dwarka,+New+Delhi',
  latitude: 28.5912,
  longitude: 77.0583,
  updatedAt: new Date().toISOString(),
  frozenSlots: []
};

// Ensure strictQuery setup
mongoose.set('strictQuery', false);

// 1. SCHEMAS
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  createdAt: { type: String, required: true },
  resetToken: { type: String, default: null },
  resetTokenExpires: { type: Number, default: null },
});

const PasswordSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
});

const BloodTestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  testName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  preparationInstructions: { type: String, required: true },
  basePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  sampleType: { type: String, required: true },
  reportTime: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  createdAt: { type: String, required: true },
});

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  tests: [{
    id: { type: String, required: true },
    testName: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    basePrice: { type: Number },
  }],
  totalAmount: { type: Number, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  status: { type: String, required: true },
  visitType: { type: String, default: 'home_visit' },
  createdAt: { type: String, required: true },
});

const PatientReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  reportFileUrl: { type: String, required: true },
  reportFileName: { type: String, required: true },
  uploadedAt: { type: String, required: true },
});

const LabInfoSchema = new mongoose.Schema({
  labName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  openingHours: { type: String, required: true },
  googleMapLink: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  updatedAt: { type: String, required: true },
  frozenSlots: { type: [String], default: [] },
});

// 2. MODELS (compiled or reused)
export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoPassword = mongoose.models.Password || mongoose.model('Password', PasswordSchema);
export const MongoBloodTest = mongoose.models.BloodTest || mongoose.model('BloodTest', BloodTestSchema);
export const MongoBooking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export const MongoPatientReport = mongoose.models.PatientReport || mongoose.model('PatientReport', PatientReportSchema);
export const MongoLabInfo = mongoose.models.LabInfo || mongoose.model('LabInfo', LabInfoSchema);

let isConnected = false;
let _localDbCache: LocalDatabase | null = null;

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MongoDB: MONGODB_URI is not configured in environment variables. Falling back to Local JSON database.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    console.log('MongoDB: Connecting to database...');
    await mongoose.connect(uri, {
      connectTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('MongoDB: Connected successfully!');
    return true;
  } catch (error) {
    console.error('MongoDB: Connection failed:', error);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

// Fetch all collections from MongoDB and construct a LocalDatabase state
export async function fetchMongoDatabase(): Promise<LocalDatabase | null> {
  if (!isConnected) return null;

  try {
    const users = await (MongoUser as any).find({}).lean();
    const passwordsDoc = await (MongoPassword as any).find({}).lean();
    const tests = await (MongoBloodTest as any).find({}).lean();
    const bookings = await (MongoBooking as any).find({}).lean();
    const reports = await (MongoPatientReport as any).find({}).lean();
    const labInfoDoc = await (MongoLabInfo as any).findOne({}).lean();

    // Reconstruct passwords record object
    const passwords: Record<string, string> = {};
    for (const p of passwordsDoc as any[]) {
      passwords[p.userId] = p.hash;
    }

    // Cast docs to correct type removing mongo internal __v and _id for simplicity
    const cleanDocs = (docs: any[]) => docs.map(({ _id, __v, ...rest }) => rest);

    return {
      users: cleanDocs(users) as User[],
      passwords,
      tests: cleanDocs(tests) as BloodTest[],
      bookings: cleanDocs(bookings) as Booking[],
      reports: cleanDocs(reports) as PatientReport[],
      labInfo: labInfoDoc ? (({ _id, __v, ...rest }) => rest)(labInfoDoc) as LabInfo : null as any,
    };
  } catch (error) {
    console.error('MongoDB: Error fetching items:', error);
    return null;
  }
}

// Sync local changes to MongoDB with high performance bulk operations / upserts
export async function syncMongoDatabase(data: LocalDatabase): Promise<void> {
  if (!isConnected) return;

  try {
    // 1. Sync Users
    if (data.users.length > 0) {
      const userOperations = data.users.map(user => ({
        updateOne: {
          filter: { id: user.id },
          update: { $set: user },
          upsert: true,
        }
      }));
      await (MongoUser as any).bulkWrite(userOperations);
      // Remove any users that are no longer in the list
      const uIds = data.users.map(u => u.id);
      await MongoUser.deleteMany({ id: { $nin: uIds } });
    } else {
      await MongoUser.deleteMany({});
    }

    // 2. Sync Passwords
    const passwordItems = Object.entries(data.passwords);
    if (passwordItems.length > 0) {
      const pwdOperations = passwordItems.map(([userId, hash]) => ({
        updateOne: {
          filter: { userId },
          update: { $set: { hash } },
          upsert: true,
        }
      }));
      await (MongoPassword as any).bulkWrite(pwdOperations);
      await MongoPassword.deleteMany({ userId: { $nin: Object.keys(data.passwords) } });
    } else {
      await MongoPassword.deleteMany({});
    }

    // 3. Sync Blood Tests
    if (data.tests.length > 0) {
      const testOperations = data.tests.map(test => ({
        updateOne: {
          filter: { id: test.id },
          update: { $set: test },
          upsert: true,
        }
      }));
      await (MongoBloodTest as any).bulkWrite(testOperations);
      await MongoBloodTest.deleteMany({ id: { $nin: data.tests.map(t => t.id) } });
    } else {
      await MongoBloodTest.deleteMany({});
    }

    // 4. Sync Bookings
    if (data.bookings.length > 0) {
      const bookingOperations = data.bookings.map(booking => ({
        updateOne: {
          filter: { id: booking.id },
          update: { $set: booking },
          upsert: true,
        }
      }));
      await (MongoBooking as any).bulkWrite(bookingOperations);
      await MongoBooking.deleteMany({ id: { $nin: data.bookings.map(b => b.id) } });
    } else {
      await MongoBooking.deleteMany({});
    }

    // 5. Sync Reports
    if (data.reports.length > 0) {
      const reportOperations = data.reports.map(report => ({
        updateOne: {
          filter: { id: report.id },
          update: { $set: report },
          upsert: true,
        }
      }));
      await (MongoPatientReport as any).bulkWrite(reportOperations);
      await MongoPatientReport.deleteMany({ id: { $nin: data.reports.map(r => r.id) } });
    } else {
      await MongoPatientReport.deleteMany({});
    }

    // 6. Sync Lab Info
    if (data.labInfo) {
      await MongoLabInfo.updateOne(
        {},
        { $set: data.labInfo },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('MongoDB: Error syncing to MongoDB:', error);
  }
}

export function readDb(): LocalDatabase {
  if (!fs.existsSync(DB_FILE)) {
    // Seed initial data
    const seedDb: LocalDatabase = {
      users: [],
      passwords: {},
      tests: [],
      bookings: [],
      reports: [],
      labInfo: DEFAULT_LAB_INFO
    };
    
    // Create Default Admin and User
    const adminId = 'u_admin_default';
    const patientId = 'u_patient_default';
    
    const adminUser: User = {
      id: adminId,
      name: 'Yadav Lab Owner & Admin',
      email: 'admin@yadavhealth.com',
      role: 'admin',
      phone: '+91 99999 88888',
      address: 'Dwarka Sector 4, New Delhi',
      createdAt: new Date().toISOString()
    };

    const patientUser: User = {
      id: patientId,
      name: 'Piya Yadav',
      email: 'patient@yadavhealth.com',
      role: 'patient',
      phone: '+91 98111 22233',
      address: 'Pocket 3, Sector 12, Dwarka',
      createdAt: new Date().toISOString()
    };

    seedDb.users.push(adminUser, patientUser);
    seedDb.passwords[adminId] = bcrypt.hashSync('AdminPassword123', 10);
    seedDb.passwords[patientId] = bcrypt.hashSync('PatientPassword123', 10);

    // Seed Tests
    seedDb.tests = [
      {
        id: 't1',
        testName: 'Complete Blood Count (CBC)',
        category: 'Haematology',
        description: 'Analyzes red blood cells, white blood cells, haemoglobin, and platelets to detect anemia, infections, or leukemia.',
        preparationInstructions: 'No fasting required. Avoid heavy fatty meals before the blood draw.',
        basePrice: 180,
        sellingPrice: 299,
        sampleType: 'Whole Blood (EDTA)',
        reportTime: '12 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 't2',
        testName: 'Lipid Profile (Cholesterol Panel)',
        category: 'Biochemistry',
        description: 'Measures total cholesterol, LDL, HDL, and triglycerides to estimate cardiovascular risk.',
        preparationInstructions: 'Fasting of 10-12 hours is mandatory. Only water is allowed during the fasting period.',
        basePrice: 250,
        sellingPrice: 420,
        sampleType: 'Serum / Plasma',
        reportTime: '12 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 't3',
        testName: 'Thyroid Profile (T3, T4, TSH)',
        category: 'Hormone & Endocrine',
        description: 'Evaluates the activity of your thyroid gland to screen for hyperthyroidism or hypothyroidism.',
        preparationInstructions: 'Fasting preferred but not mandatory. Morning sample recommended.',
        basePrice: 300,
        sellingPrice: 550,
        sampleType: 'Serum',
        reportTime: '24 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 't4',
        testName: 'HbA1c (Glycated Haemoglobin)',
        category: 'Diabetes Care',
        description: 'Measures your average blood sugar levels over the past 2 to 3 months to monitor or diagnose Glycemia.',
        preparationInstructions: 'No fasting required. Can be done at any time of the day.',
        basePrice: 150,
        sellingPrice: 280,
        sampleType: 'EDTA Whole Blood',
        reportTime: '8 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 't5',
        testName: 'Liver Function Test (LFT)',
        category: 'Biochemistry',
        description: 'Measures enzymes, proteins, and bilirubin levels to check how well your liver is functioning.',
        preparationInstructions: 'Fasting of 8-10 hours is recommended before the test.',
        basePrice: 350,
        sellingPrice: 600,
        sampleType: 'Serum',
        reportTime: '24 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 't6',
        testName: 'Vitamin D3 (25-Hydroxy)',
        category: 'Vitamins',
        description: 'Measures concentration of Vitamin D in blood. Essential for healthy bones, immune function, and overall cellular vitality.',
        preparationInstructions: 'No fasting required. Morning collection is preferred.',
        basePrice: 600,
        sellingPrice: 999,
        sampleType: 'Serum',
        reportTime: '24 Hours',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(seedDb, null, 2));
    _localDbCache = seedDb;
    return seedDb;
  }
  if (_localDbCache) return _localDbCache;
  _localDbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  return _localDbCache!;
}

export function writeDb(data: LocalDatabase) {
  _localDbCache = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  
  if (isMongoConnected()) {
    // Perform async background sync to prevent blocking client responses
    syncMongoDatabase(data).catch(err => {
      console.error('MongoDB: Background sync failed:', err);
    });
  }
}

// Ensure database file is initialized at startup
readDb();

// Asynchronous MongoDB connection and initial sync
export async function initMongoDB() {
  const connected = await connectMongoDB();
  if (connected) {
    console.log('MongoDB: Initializing database synchronization...');
    try {
      const remoteDb = await fetchMongoDatabase();
      if (remoteDb && remoteDb.users && remoteDb.users.length > 0) {
        console.log('MongoDB: Found existing remote data, syncing down...');
        _localDbCache = remoteDb;
        fs.writeFileSync(DB_FILE, JSON.stringify(_localDbCache, null, 2));
      } else {
        console.log('MongoDB: Remote database is empty, seeding from local data...');
        const currentLocal = readDb();
        await syncMongoDatabase(currentLocal);
      }
    } catch (err) {
      console.error('MongoDB: Error during initial database sync:', err);
    }
  }
}

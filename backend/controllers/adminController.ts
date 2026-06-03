import { readDb, writeDb } from '../models/db';
import { BloodTest, PatientReport, User } from '../../frontend/src/types';

export const createAdminTest = (req: any, res: any) => {
  const { testName, category, description, preparationInstructions, basePrice, sellingPrice, sampleType, reportTime } = req.body;
  
  if (!testName || !category || !description || basePrice === undefined || sellingPrice === undefined || !sampleType || !reportTime) {
    return res.status(400).json({ error: 'Missing required blood test specification details.' });
  }

  const db = readDb();
  const newTest: BloodTest = {
    id: 't_' + Math.random().toString(36).substr(2, 9),
    testName,
    category,
    description,
    preparationInstructions: preparationInstructions || 'No preparation required.',
    basePrice: Number(basePrice),
    sellingPrice: Number(sellingPrice),
    sampleType,
    reportTime,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.tests.push(newTest);
  writeDb(db);
  res.status(201).json({ test: newTest });
};

export const updateAdminTest = (req: any, res: any) => {
  const db = readDb();
  const index = db.tests.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const current = db.tests[index];
  const updatedValue: BloodTest = {
    ...current,
    ...req.body,
    // Cast explicitly
    basePrice: req.body.basePrice !== undefined ? Number(req.body.basePrice) : current.basePrice,
    sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : current.sellingPrice,
  };

  db.tests[index] = updatedValue;
  writeDb(db);
  res.json({ test: updatedValue });
};

export const deleteAdminTest = (req: any, res: any) => {
  const db = readDb();
  const filtered = db.tests.filter(t => t.id !== req.params.id);
  if (filtered.length === db.tests.length) {
    return res.status(404).json({ error: 'Blood test not found' });
  }
  db.tests = filtered;
  writeDb(db);
  res.json({ success: true, message: 'Test successfully removed from Yadav catalog.' });
};

export const getAdminBookings = (req: any, res: any) => {
  const db = readDb();
  res.json({ bookings: db.bookings });
};

export const updateAdminBookingStatus = (req: any, res: any) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const db = readDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Appointment booking not found.' });
  }

  booking.status = status;
  writeDb(db);
  res.json({ booking });
};

export const uploadAdminReport = (req: any, res: any) => {
  const { bookingId, reportFileName, reportFileUrl } = req.body;
  
  if (!bookingId || !reportFileUrl) {
    return res.status(400).json({ error: 'Booking ID and laboratory report file link are required.' });
  }

  const db = readDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return res.status(404).json({ error: 'No booking found associated with that ID.' });
  }

  const reportId = 'rep_' + Math.random().toString(36).substr(2, 9);
  const newReport: PatientReport = {
    id: reportId,
    bookingId,
    patientId: booking.patientId,
    patientName: booking.patientName,
    uploadedBy: req.user.id,
    reportFileUrl, // Stores either data64 url or custom clinical metadata
    reportFileName: reportFileName || `${booking.patientName}_Report_${booking.appointmentDate}.pdf`,
    uploadedAt: new Date().toISOString()
  };

  db.reports.push(newReport);
  
  // Auto elevate booking status
  booking.status = 'report_uploaded';
  
  writeDb(db);
  res.status(201).json({ report: newReport });
};

export const getAdminReports = (req: any, res: any) => {
  const db = readDb();
  res.json({ reports: db.reports });
};

export const getAdminPatients = (req: any, res: any) => {
  const db = readDb();
  const patientsOnly = db.users.filter(u => u.role === 'patient');
  res.json({ patients: patientsOnly });
};

export const updateAdminLabInfo = (req: any, res: any) => {
  const db = readDb();
  db.labInfo = {
    ...db.labInfo,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeDb(db);
  res.json({ labInfo: db.labInfo });
};

import { readDbAsync, writeDb } from '../models/db';
import { Booking } from '../../frontend/src/types';

export const createBooking = async (req: any, res: any) => {
  const { tests: testIds, appointmentDate, appointmentTime, visitType } = req.body;
  
  if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one lab test to schedule an appointment.' });
  }
  
  if (!appointmentDate || !appointmentTime) {
    return res.status(400).json({ error: 'Preferred slot Date and Time are required.' });
  }

  const db = await readDbAsync();

  // Validate slots limit: maximum slots (8-9 AM is 1 slot, other slots are 3 slots)
  const maxSlots = appointmentTime === "08:00 AM - 09:00 AM" ? 1 : 3;
  const isFrozen = !!(db.labInfo.frozenSlots && (db.labInfo.frozenSlots.includes(`${appointmentDate}_${appointmentTime}`) || db.labInfo.frozenSlots.includes(appointmentTime)));
  if (isFrozen) {
    return res.status(400).json({
      error: `The selection slot '${appointmentTime}' is currently frozen/not available at Yadav Diagnostics. Please select another slot interval.`
    });
  }

  const existingBookingsCount = db.bookings.filter(b => 
    b.appointmentDate === appointmentDate && 
    b.appointmentTime === appointmentTime && 
    b.status !== 'cancelled'
  ).length;

  if (existingBookingsCount >= maxSlots) {
    return res.status(400).json({
      error: `The physical slot '${appointmentTime}' on ${appointmentDate} is fully booked (${existingBookingsCount}/${maxSlots} slots taken). Please reserve another time interval.`
    });
  }
  
  // Resolve tests and calculate total
  const resolvedTests: { id: string; testName: string; sellingPrice: number; basePrice?: number }[] = [];
  let totalAmount = 0;

  for (const tid of testIds) {
    const realTest = db.tests.find(t => t.id === tid && t.isActive);
    if (!realTest) {
      return res.status(400).json({ error: `Selected test with ID ${tid} is unavailable.` });
    }
    resolvedTests.push({
      id: realTest.id,
      testName: realTest.testName,
      sellingPrice: realTest.sellingPrice,
      basePrice: realTest.basePrice // Admin can query this inside bookings, but user won't get it in patient router response
    });
    totalAmount += realTest.sellingPrice;
  }

  const bookingId = 'b_' + Math.random().toString(36).substr(2, 9);
  
  const creator = db.users.find(u => u.id === req.user.id);
  if (!creator) {
    return res.status(404).json({ error: 'Profile not found. Re-authenticate please.' });
  }

  const newBooking: Booking = {
    id: bookingId,
    patientId: req.user.id,
    patientName: creator.name,
    patientEmail: creator.email,
    tests: resolvedTests,
    totalAmount,
    appointmentDate,
    appointmentTime,
    status: 'pending',
    visitType: visitType || 'home_visit',
    createdAt: new Date().toISOString()
  };

  db.bookings.push(newBooking);
  writeDb(db);

  res.status(201).json({ booking: newBooking });
};

export const getMyBookings = async (req: any, res: any) => {
  const db = await readDbAsync();
  // Fetch bookings belonging strictly to this patient
  const patientBookings = db.bookings.filter(b => b.patientId === req.user.id);
  
  // Security review: strip out basePrices if patient is requesting
  const sanitizedBookings = patientBookings.map(b => {
    return {
      ...b,
      tests: b.tests.map(t => {
        const { basePrice, ...rest } = t;
        return rest;
      })
    };
  });

  res.json({ bookings: sanitizedBookings });
};

export const getSlotsAvailability = async (req: any, res: any) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required.' });
  }

  const db = await readDbAsync();
  const targetDate = String(date);
  
  const targetBookings = db.bookings.filter(b => b.appointmentDate === targetDate && b.status !== 'cancelled');
  
  const standardTimeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "01:00 PM - 03:00 PM",
    "04:00 PM - 06:00 PM",
    "06:00 PM - 08:00 PM"
  ];

  const slotsAvailability = standardTimeSlots.map(time => {
    const bookedCount = targetBookings.filter(b => b.appointmentTime === time).length;
    const maxSlots = time === "08:00 AM - 09:00 AM" ? 1 : 3;
    const isFrozen = !!(db.labInfo.frozenSlots && (db.labInfo.frozenSlots.includes(`${targetDate}_${time}`) || db.labInfo.frozenSlots.includes(time)));
    const remaining = isFrozen ? 0 : Math.max(0, maxSlots - bookedCount);
    return {
      timeSlot: time,
      bookedCount,
      maxSlots,
      remainingSlots: remaining,
      isFrozen
    };
  });

  res.json({ slots: slotsAvailability });
};

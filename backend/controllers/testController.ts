import jwt from 'jsonwebtoken';
import { readDbAsync } from '../models/db';
import { JWT_SECRET } from '../middlewares/authMiddleware';
import { getActiveOffer, withPricing, toActiveOfferSummary } from '../services/offerService';

export const getTests = async (req: any, res: any) => {
  const db = await readDbAsync();
  
  // Extract token if exists to check role
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isAdmin = false;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAdmin = true;
      }
    } catch (e) {
      // ignore expired token or invalid key for basic retrieval
    }
  }

  // Filter to active tests only or provide complete list
  const activeTests = db.tests.filter(t => t.isActive);
  
  const offer = getActiveOffer(db);
  const mappedTests = activeTests.map(t => {
    if (isAdmin) return withPricing(t, offer); // Admins get basePrice
    const { basePrice, ...rest } = t; // Patients get rest without basePrice
    return withPricing(rest as typeof t, offer);
  });

  res.json({ tests: mappedTests, activeOffer: toActiveOfferSummary(offer) });
};

export const getTestById = async (req: any, res: any) => {
  const db = await readDbAsync();
  const test = db.tests.find(t => t.id === req.params.id);
  
  if (!test) {
    return res.status(404).json({ error: 'Blood test not found.' });
  }

  // Check admin
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isAdmin = false;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAdmin = true;
      }
    } catch (e) {}
  }

  const offer = getActiveOffer(db);
  if (isAdmin) {
    res.json({ test: withPricing(test, offer) });
  } else {
    const { basePrice, ...restWithoutBase } = test;
    res.json({ test: withPricing(restWithoutBase as typeof test, offer) });
  }
};

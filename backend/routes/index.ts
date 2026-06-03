import { Router } from 'express';
import authRoutes from './authRoutes';
import testRoutes from './testRoutes';
import bookingRoutes from './bookingRoutes';
import slotRoutes from './slotRoutes';
import reportRoutes from './reportRoutes';
import labRoutes from './labRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tests', testRoutes);
router.use('/bookings', bookingRoutes);
router.use('/slots', slotRoutes);
router.use('/reports', reportRoutes);
router.use('/lab-info', labRoutes);
router.use('/admin', adminRoutes);

// Sample test route
router.get('/test', (req, res) => {
  res.json({
    message: 'Backend server is fully integrated and healthy!',
    timestamp: new Date().toISOString(),
    databaseConnected: require('../models/db').isMongoConnected()
  });
});

export default router;

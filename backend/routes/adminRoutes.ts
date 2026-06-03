import { Router } from 'express';
import {
  createAdminTest,
  updateAdminTest,
  deleteAdminTest,
  getAdminBookings,
  updateAdminBookingStatus,
  uploadAdminReport,
  getAdminReports,
  getAdminPatients,
  updateAdminLabInfo
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Apply admin privilege check to all subrouters
router.use(authenticateToken);
router.use(requireAdmin);

// Blood Tests Management
router.post('/tests', createAdminTest);
router.put('/tests/:id', updateAdminTest);
router.delete('/tests/:id', deleteAdminTest);

// Bookings Tracking
router.get('/bookings', getAdminBookings);
router.put('/bookings/:id/status', updateAdminBookingStatus);

// Medical Reports Delivery
router.post('/reports/upload', uploadAdminReport);
router.get('/reports', getAdminReports);

// Patient Profiles Overview
router.get('/patients', getAdminPatients);

// Branch Information
router.put('/lab-info', updateAdminLabInfo);

export default router;

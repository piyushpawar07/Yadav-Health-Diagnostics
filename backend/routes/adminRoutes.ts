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
import {
  getAdminOffer,
  saveAdminOffer,
  deleteAdminOffer,
  uploadAdminOfferPoster,
  deleteAdminOfferPoster,
  getAdminOfferPoster
} from '../controllers/offerController';
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

// Festival Offer and Poster
router.get('/offer', getAdminOffer);
router.put('/offer', saveAdminOffer);
router.delete('/offer', deleteAdminOffer);
router.get('/offer/poster', getAdminOfferPoster);
router.put('/offer/poster', uploadAdminOfferPoster);
router.delete('/offer/poster', deleteAdminOfferPoster);

export default router;

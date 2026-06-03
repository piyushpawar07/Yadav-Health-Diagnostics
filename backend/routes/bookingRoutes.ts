import { Router } from 'express';
import { createBooking, getMyBookings } from '../controllers/bookingController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);

export default router;

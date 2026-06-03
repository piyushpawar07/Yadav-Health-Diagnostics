import { Router } from 'express';
import { getSlotsAvailability } from '../controllers/bookingController';

const router = Router();

router.get('/availability', getSlotsAvailability);

export default router;

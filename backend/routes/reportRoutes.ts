import { Router } from 'express';
import { getMyReports } from '../controllers/reportController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/my-reports', authenticateToken, getMyReports);

export default router;

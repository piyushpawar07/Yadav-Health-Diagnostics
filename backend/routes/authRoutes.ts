import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, validateResetToken } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/validate-token', validateResetToken);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);

export default router;

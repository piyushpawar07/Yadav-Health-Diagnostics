import { Router } from 'express';
import { getPublicOfferPoster } from '../controllers/offerController';

const router = Router();

router.get('/poster', getPublicOfferPoster);

export default router;

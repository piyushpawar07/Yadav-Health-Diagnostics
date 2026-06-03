import { Router } from 'express';
import { getLabInfo } from '../controllers/labController';

const router = Router();

router.get('/', getLabInfo);

export default router;

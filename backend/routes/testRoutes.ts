import { Router } from 'express';
import { getTests, getTestById } from '../controllers/testController';

const router = Router();

router.get('/', getTests);
router.get('/:id', getTestById);

export default router;

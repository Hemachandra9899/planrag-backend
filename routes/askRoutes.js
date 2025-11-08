// src/routes/askRoutes.js
import { Router } from 'express';
import { handleQuestion } from '../controllers/askController.js';

const router = Router();

router.post('/', handleQuestion);

export default router;

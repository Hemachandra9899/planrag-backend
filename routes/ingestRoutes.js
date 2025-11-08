// src/routes/ingestRoutes.js
import { Router } from 'express';
import { ingestDocuments } from '../controllers/ingestController.js';

const router = Router();

router.post('/', ingestDocuments);

export default router;

import { Router } from 'express';
import { getSignature } from '../controllers/signatureController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Protected signature retrieval
router.get('/:filename', authenticate, getSignature);

export default router;

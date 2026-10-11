import { Router } from 'express';
import {
  getAccountsDashboard,
  getAllVouchers,
} from '../controllers/accountsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { voucherFilterQuerySchema } from '../validators/queryValidators.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Restrict all accounts routes to ACCOUNTS role
router.use(authenticate, authorizeRoles(UserRole.ACCOUNTS));

// Accounts Dashboard
router.get('/dashboard', getAccountsDashboard);

// All vouchers across organization (read-only)
router.get('/vouchers', validate(voucherFilterQuerySchema, 'query'), getAllVouchers);

export default router;

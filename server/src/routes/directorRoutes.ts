import { Router } from 'express';
import {
  getDirectorDashboard,
  getAllVouchers,
  getPendingVouchers,
  approveVoucher,
  rejectVoucher,
} from '../controllers/directorController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { uploadSignatureMem, validateAndSaveSignature } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { rejectVoucherSchema } from '../validators/voucherValidators.js';
import { voucherFilterQuerySchema } from '../validators/queryValidators.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Restrict all director routes to DIRECTOR role
router.use(authenticate, authorizeRoles(UserRole.DIRECTOR));

// Director Dashboard
router.get('/dashboard', getDirectorDashboard);

// All vouchers across organization
router.get('/vouchers', validate(voucherFilterQuerySchema, 'query'), getAllVouchers);

// Pending approvals queue
router.get('/vouchers/pending', validate(voucherFilterQuerySchema, 'query'), getPendingVouchers);

// Approve voucher with director signature upload
router.post(
  '/vouchers/:id/approve',
  uploadSignatureMem,
  validateAndSaveSignature,
  approveVoucher
);

// Reject voucher with mandatory reason
router.post('/vouchers/:id/reject', validate(rejectVoucherSchema), rejectVoucher);

export default router;

import { Router } from 'express';
import {
  createVoucher,
  getMyVouchers,
  getVoucherById,
  updateDraftVoucher,
  deleteDraftVoucher,
  submitVoucher,
  getEmployeeDashboard,
} from '../controllers/voucherController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { uploadSignatureMem, validateAndSaveSignature } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createVoucherSchema,
  updateDraftSchema,
} from '../validators/voucherValidators.js';
import { voucherFilterQuerySchema } from '../validators/queryValidators.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Employee dashboard
router.get(
  '/dashboard',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  getEmployeeDashboard
);

// Employee's own vouchers
router.get(
  '/my',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  validate(voucherFilterQuerySchema, 'query'),
  getMyVouchers
);

// Create new voucher (Draft or Submit)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  uploadSignatureMem,
  validateAndSaveSignature,
  validate(createVoucherSchema),
  createVoucher
);

// Get specific voucher by ID (accessible by Employee owner, Director, or Accounts)
router.get('/:id', authenticate, getVoucherById);

// Update draft voucher
router.patch(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  uploadSignatureMem,
  validateAndSaveSignature,
  validate(updateDraftSchema),
  updateDraftVoucher
);

// Delete draft voucher
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  deleteDraftVoucher
);

// Submit draft voucher for approval
router.post(
  '/:id/submit',
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE),
  uploadSignatureMem,
  validateAndSaveSignature,
  submitVoucher
);

export default router;

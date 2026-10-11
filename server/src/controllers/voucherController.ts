import { Request, Response, NextFunction } from 'express';
import mongoose from 'express';
import { Voucher } from '../models/Voucher.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole, VoucherStatus, AuditAction } from '../types/index.js';
import { generateVoucherNumber } from '../services/counterService.js';
import { logAuditEvent } from '../services/auditService.js';
import { queryVouchers } from '../services/voucherService.js';
import { toMinorUnits, toMajorUnits } from '../utils/currency.js';
import { safeDeleteFile } from '../utils/fileSecurity.js';
import path from 'path';
import { config } from '../config/env.js';

export async function createVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const {
      voucherDate,
      expenseDate,
      department,
      expenseTitle,
      expenseCategory,
      expenseDescription,
      amount,
      isDraft,
    } = req.body;

    const signatureFilename = (req as any).savedSignatureFilename;

    const shouldSubmit = isDraft === false || isDraft === 'false';

    // If submitting directly, employee signature is strictly mandatory
    if (shouldSubmit && !signatureFilename) {
      return res.status(400).json({
        success: false,
        message: 'Employee signature is mandatory when submitting a voucher for approval.',
      });
    }

    const minorAmount = toMinorUnits(amount);
    const voucherNumber = await generateVoucherNumber();

    const initialStatus = shouldSubmit ? VoucherStatus.PENDING_APPROVAL : VoucherStatus.DRAFT;

    const voucher = await Voucher.create({
      voucherNumber,
      voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
      expenseDate: new Date(expenseDate),
      department,
      expenseTitle,
      expenseCategory,
      expenseDescription: expenseDescription || '',
      amount: minorAmount,
      employeeId: userId,
      employeeSignaturePath: signatureFilename,
      status: initialStatus,
      submittedAt: shouldSubmit ? new Date() : undefined,
    });

    // Log audit trail
    await logAuditEvent({
      actorId: userId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: shouldSubmit ? AuditAction.SUBMIT : AuditAction.CREATE,
      newStatus: initialStatus,
      details: {
        isDraft: !shouldSubmit,
        amount: toMajorUnits(minorAmount),
      },
    });

    return res.status(201).json({
      success: true,
      message: shouldSubmit
        ? 'Voucher submitted successfully for approval'
        : 'Voucher saved as draft successfully',
      voucher,
    });
  } catch (error) {
    // If voucher creation failed but file was uploaded, safely clean up file
    if ((req as any).savedSignaturePath) {
      safeDeleteFile((req as any).savedSignaturePath);
    }
    next(error);
  }
}

export async function getMyVouchers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const result = await queryVouchers({
      filterQuery: req.query as any,
      extraMatch: { employeeId: userId },
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVoucherById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const voucher = await Voucher.findById(id)
      .populate('employeeId', 'name email employeeId department')
      .populate('reviewedById', 'name email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Role ownership check
    if (user.role === UserRole.EMPLOYEE && voucher.employeeId._id.toString() !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view vouchers created by yourself.',
      });
    }

    // Retrieve audit history for voucher
    const auditLogs = await AuditLog.find({ voucherId: voucher._id })
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      voucher,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDraftVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Ownership check
    if (voucher.employeeId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own vouchers.',
      });
    }

    // Status check
    if (voucher.status !== VoucherStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit voucher. Only DRAFT vouchers can be modified (current status: ${voucher.status}).`,
      });
    }

    const {
      voucherDate,
      expenseDate,
      department,
      expenseTitle,
      expenseCategory,
      expenseDescription,
      amount,
    } = req.body;

    if (voucherDate) voucher.voucherDate = new Date(voucherDate);
    if (expenseDate) voucher.expenseDate = new Date(expenseDate);
    if (department) voucher.department = department;
    if (expenseTitle) voucher.expenseTitle = expenseTitle;
    if (expenseCategory) voucher.expenseCategory = expenseCategory;
    if (expenseDescription !== undefined) voucher.expenseDescription = expenseDescription;
    if (amount !== undefined) voucher.amount = toMinorUnits(amount);

    const newSignature = (req as any).savedSignatureFilename;
    if (newSignature) {
      // Clean up previous signature file if exists
      if (voucher.employeeSignaturePath) {
        safeDeleteFile(path.join(config.uploadDir, voucher.employeeSignaturePath));
      }
      voucher.employeeSignaturePath = newSignature;
    }

    await voucher.save();

    await logAuditEvent({
      actorId: userId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: AuditAction.UPDATE,
      details: {
        updatedFields: Object.keys(req.body),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Draft voucher updated successfully',
      voucher,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDraftVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Ownership check
    if (voucher.employeeId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own vouchers.',
      });
    }

    // Status check
    if (voucher.status !== VoucherStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete voucher. Only DRAFT vouchers can be deleted (current status: ${voucher.status}).`,
      });
    }

    // Clean up signature file if any
    if (voucher.employeeSignaturePath) {
      safeDeleteFile(path.join(config.uploadDir, voucher.employeeSignaturePath));
    }

    await Voucher.findByIdAndDelete(id);

    await logAuditEvent({
      actorId: userId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: AuditAction.DELETE,
      previousStatus: VoucherStatus.DRAFT,
    });

    return res.status(200).json({
      success: true,
      message: 'Draft voucher deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function submitVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
    }

    // Ownership check
    if (voucher.employeeId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only submit your own vouchers.',
      });
    }

    // Status check
    if (voucher.status !== VoucherStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT vouchers can be submitted (current status: ${voucher.status}).`,
      });
    }

    // Signature check
    const newSignature = (req as any).savedSignatureFilename;
    if (newSignature) {
      voucher.employeeSignaturePath = newSignature;
    }

    if (!voucher.employeeSignaturePath) {
      return res.status(400).json({
        success: false,
        message: 'Employee signature is mandatory before submitting a voucher for approval.',
      });
    }

    // Check mandatory fields
    if (!voucher.department || !voucher.expenseTitle || !voucher.expenseDate || !voucher.amount) {
      return res.status(400).json({
        success: false,
        message: 'All mandatory fields (Department, Expense Title, Expense Date, Amount) must be filled.',
      });
    }

    voucher.status = VoucherStatus.PENDING_APPROVAL;
    voucher.submittedAt = new Date();
    await voucher.save();

    await logAuditEvent({
      actorId: userId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: AuditAction.SUBMIT,
      previousStatus: VoucherStatus.DRAFT,
      newStatus: VoucherStatus.PENDING_APPROVAL,
    });

    return res.status(200).json({
      success: true,
      message: 'Voucher submitted for Director approval successfully',
      voucher,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const userObjectId = new (Voucher.base as any).Types.ObjectId(userId);

    const [stats, recentVouchers] = await Promise.all([
      Voucher.aggregate([
        { $match: { employeeId: userObjectId } },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            draftCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.DRAFT] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.PENDING_APPROVAL] }, 1, 0] },
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.APPROVED] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.REJECTED] }, 1, 0] },
            },
            // Total claimed amount includes all submitted, pending, and approved vouchers
            totalClaimedMinor: {
              $sum: {
                $cond: [
                  { $in: ['$status', [VoucherStatus.PENDING_APPROVAL, VoucherStatus.APPROVED]] },
                  '$amount',
                  0,
                ],
              },
            },
            totalDraftMinor: {
              $sum: {
                $cond: [{ $eq: ['$status', VoucherStatus.DRAFT] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      Voucher.find({ employeeId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const statData = stats[0] || {
      totalCount: 0,
      draftCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      totalClaimedMinor: 0,
      totalDraftMinor: 0,
    };

    return res.status(200).json({
      success: true,
      metrics: {
        totalVouchers: statData.totalCount,
        draftVouchers: statData.draftCount,
        pendingApproval: statData.pendingCount,
        approvedVouchers: statData.approvedCount,
        rejectedVouchers: statData.rejectedCount,
        totalClaimedAmount: toMajorUnits(statData.totalClaimedMinor),
        totalDraftAmount: toMajorUnits(statData.totalDraftMinor),
      },
      recentVouchers,
    });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Voucher } from '../models/Voucher.js';
import { VoucherStatus, AuditAction } from '../types/index.js';
import { logAuditEvent } from '../services/auditService.js';
import { queryVouchers } from '../services/voucherService.js';
import { toMajorUnits } from '../utils/currency.js';
import { safeDeleteFile } from '../utils/fileSecurity.js';

export async function getDirectorDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [stats, statusBreakdown, recentActivity] = await Promise.all([
      Voucher.aggregate([
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.PENDING_APPROVAL] }, 1, 0] },
            },
            totalPendingAmountMinor: {
              $sum: {
                $cond: [{ $eq: ['$status', VoucherStatus.PENDING_APPROVAL] }, '$amount', 0],
              },
            },
            approvedTodayCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', VoucherStatus.APPROVED] },
                      { $gte: ['$approvalDate', startOfToday] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            rejectedTodayCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', VoucherStatus.REJECTED] },
                      { $gte: ['$updatedAt', startOfToday] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      // Status breakdown for charts
      Voucher.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmountMinor: { $sum: '$amount' },
          },
        },
      ]),
      // Recent submissions awaiting or recently acted upon
      Voucher.find()
        .populate('employeeId', 'name email department')
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const statData = stats[0] || {
      totalCount: 0,
      pendingCount: 0,
      totalPendingAmountMinor: 0,
      approvedTodayCount: 0,
      rejectedTodayCount: 0,
    };

    const formattedBreakdown = statusBreakdown.map((item) => ({
      status: item._id,
      count: item.count,
      totalAmount: toMajorUnits(item.totalAmountMinor),
    }));

    return res.status(200).json({
      success: true,
      metrics: {
        totalVouchers: statData.totalCount,
        pendingApprovalCount: statData.pendingCount,
        approvedToday: statData.approvedTodayCount,
        rejectedToday: statData.rejectedTodayCount,
        totalPendingAmount: toMajorUnits(statData.totalPendingAmountMinor),
      },
      statusBreakdown: formattedBreakdown,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllVouchers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await queryVouchers({
      filterQuery: req.query as any,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingVouchers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await queryVouchers({
      filterQuery: req.query as any,
      extraMatch: { status: VoucherStatus.PENDING_APPROVAL },
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const directorId = req.user!.userId;
    const signatureFilename = (req as any).savedSignatureFilename;

    if (!signatureFilename) {
      return res.status(400).json({
        success: false,
        message: 'Director signature is mandatory to approve an expense voucher.',
      });
    }

    // Atomic conditional status update to prevent race conditions or double review
    const voucher = await Voucher.findOneAndUpdate(
      {
        _id: id,
        status: VoucherStatus.PENDING_APPROVAL,
      },
      {
        $set: {
          status: VoucherStatus.APPROVED,
          directorSignaturePath: signatureFilename,
          reviewedById: new mongoose.Types.ObjectId(directorId),
          approvalDate: new Date(),
        },
      },
      { new: true }
    )
      .populate('employeeId', 'name email department')
      .populate('reviewedById', 'name email');

    if (!voucher) {
      // Clean up uploaded file if update failed
      if ((req as any).savedSignaturePath) {
        safeDeleteFile((req as any).savedSignaturePath);
      }

      // Check if voucher exists but has wrong status
      const existing = await Voucher.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Voucher cannot be approved because its current status is ${existing.status}. Only PENDING_APPROVAL vouchers can be approved.`,
      });
    }

    await logAuditEvent({
      actorId: directorId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: AuditAction.APPROVE,
      previousStatus: VoucherStatus.PENDING_APPROVAL,
      newStatus: VoucherStatus.APPROVED,
      details: {
        approvalDate: voucher.approvalDate,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Voucher approved successfully with Director signature.',
      voucher,
    });
  } catch (error) {
    if ((req as any).savedSignaturePath) {
      safeDeleteFile((req as any).savedSignaturePath);
    }
    next(error);
  }
}

export async function rejectVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const directorId = req.user!.userId;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory.',
      });
    }

    // Atomic conditional status update
    const voucher = await Voucher.findOneAndUpdate(
      {
        _id: id,
        status: VoucherStatus.PENDING_APPROVAL,
      },
      {
        $set: {
          status: VoucherStatus.REJECTED,
          rejectionReason: rejectionReason.trim(),
          reviewedById: new mongoose.Types.ObjectId(directorId),
        },
      },
      { new: true }
    )
      .populate('employeeId', 'name email department')
      .populate('reviewedById', 'name email');

    if (!voucher) {
      const existing = await Voucher.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Voucher cannot be rejected because its current status is ${existing.status}. Only PENDING_APPROVAL vouchers can be rejected.`,
      });
    }

    await logAuditEvent({
      actorId: directorId,
      voucherId: voucher._id,
      voucherNumber: voucher.voucherNumber,
      action: AuditAction.REJECT,
      previousStatus: VoucherStatus.PENDING_APPROVAL,
      newStatus: VoucherStatus.REJECTED,
      details: {
        rejectionReason: rejectionReason.trim(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Voucher rejected successfully.',
      voucher,
    });
  } catch (error) {
    next(error);
  }
}

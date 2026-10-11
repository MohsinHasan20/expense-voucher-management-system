import { Request, Response, NextFunction } from 'express';
import { Voucher } from '../models/Voucher.js';
import { VoucherStatus } from '../types/index.js';
import { queryVouchers } from '../services/voucherService.js';
import { toMajorUnits } from '../utils/currency.js';

export async function getAccountsDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const [stats, recentApproved] = await Promise.all([
      Voucher.aggregate([
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.PENDING_APPROVAL] }, 1, 0] },
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.APPROVED] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', VoucherStatus.REJECTED] }, 1, 0] },
            },
            totalApprovedAmountMinor: {
              $sum: {
                $cond: [{ $eq: ['$status', VoucherStatus.APPROVED] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      // Recent approved vouchers ready for reimbursement
      Voucher.find({ status: VoucherStatus.APPROVED })
        .populate('employeeId', 'name email department employeeId')
        .populate('reviewedById', 'name email')
        .sort({ approvalDate: -1, updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const statData = stats[0] || {
      totalCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      totalApprovedAmountMinor: 0,
    };

    return res.status(200).json({
      success: true,
      metrics: {
        totalVouchers: statData.totalCount,
        pendingApproval: statData.pendingCount,
        approvedVouchers: statData.approvedCount,
        rejectedVouchers: statData.rejectedCount,
        totalApprovedExpenseAmount: toMajorUnits(statData.totalApprovedAmountMinor),
      },
      recentApprovedVouchers: recentApproved,
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

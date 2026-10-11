import mongoose from 'mongoose';
import { Voucher, IVoucherDocument } from '../models/Voucher.js';
import { User } from '../models/User.js';
import { VoucherFilterQuery } from '../validators/queryValidators.js';
import { toMinorUnits } from '../utils/currency.js';

interface QueryOptions {
  filterQuery: VoucherFilterQuery;
  extraMatch?: Record<string, any>;
}

// Helper to escape user input for safe RegExp matching without regex injection
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function queryVouchers({ filterQuery, extraMatch = {} }: QueryOptions) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    voucherNumber,
    employeeName,
    department,
    expenseCategory,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  } = filterQuery;

  const matchConditions: Record<string, any> = { ...extraMatch };

  // Status filter
  if (status) {
    matchConditions.status = status;
  }

  // Department filter
  if (department) {
    matchConditions.department = { $regex: new RegExp(`^${escapeRegExp(department)}$`, 'i') };
  }

  // Category filter
  if (expenseCategory) {
    matchConditions.expenseCategory = expenseCategory;
  }

  // Voucher Number filter
  if (voucherNumber) {
    matchConditions.voucherNumber = { $regex: new RegExp(escapeRegExp(voucherNumber), 'i') };
  }

  // General search across voucherNumber, expenseTitle, department
  if (search) {
    const safeSearch = escapeRegExp(search);
    matchConditions.$or = [
      { voucherNumber: { $regex: new RegExp(safeSearch, 'i') } },
      { expenseTitle: { $regex: new RegExp(safeSearch, 'i') } },
      { department: { $regex: new RegExp(safeSearch, 'i') } },
    ];
  }

  // Date range filter
  if (startDate || endDate) {
    matchConditions.expenseDate = {};
    if (startDate) {
      matchConditions.expenseDate.$gte = new Date(startDate);
    }
    if (endDate) {
      // Include the end of the selected day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchConditions.expenseDate.$lte = end;
    }
  }

  // Amount range filter (stored in minor units in DB)
  if (minAmount !== undefined || maxAmount !== undefined) {
    matchConditions.amount = {};
    if (minAmount !== undefined) {
      matchConditions.amount.$gte = toMinorUnits(minAmount);
    }
    if (maxAmount !== undefined) {
      matchConditions.amount.$lte = toMinorUnits(maxAmount);
    }
  }

  // If employeeName search is specified, find matching user IDs first
  if (employeeName) {
    const users = await User.find({
      name: { $regex: new RegExp(escapeRegExp(employeeName), 'i') },
    }).select('_id');
    const userIds = users.map((u) => u._id);
    if (matchConditions.employeeId) {
      // If employeeId is already constrained (e.g. employee's own vouchers), check intersection
      if (!userIds.some((id) => id.toString() === matchConditions.employeeId.toString())) {
        return {
          items: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
        };
      }
    } else {
      matchConditions.employeeId = { $in: userIds };
    }
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDirection };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Voucher.find(matchConditions)
      .populate('employeeId', 'name email employeeId department')
      .populate('reviewedById', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Voucher.countDocuments(matchConditions),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    totalPages,
    limit,
  };
}

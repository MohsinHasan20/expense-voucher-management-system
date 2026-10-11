import { z } from 'zod';
import { VoucherStatus } from '../types/index.js';

const ALLOWED_SORT_FIELDS = [
  'voucherNumber',
  'voucherDate',
  'expenseDate',
  'amount',
  'status',
  'department',
  'expenseCategory',
  'createdAt',
];

export const voucherFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .string()
    .refine((val) => ALLOWED_SORT_FIELDS.includes(val), {
      message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`,
    })
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(100).optional(),
  voucherNumber: z.string().trim().max(50).optional(),
  employeeName: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  expenseCategory: z.string().trim().max(100).optional(),
  status: z.nativeEnum(VoucherStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
});

export type VoucherFilterQuery = z.infer<typeof voucherFilterQuerySchema>;

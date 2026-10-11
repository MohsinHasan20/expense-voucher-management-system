import { z } from 'zod';

export const createVoucherSchema = z.object({
  voucherDate: z.string().or(z.date()).optional(),
  expenseDate: z.string().or(z.date()).refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Valid expense date is required',
  }),
  department: z.string().trim().min(1, 'Department is mandatory'),
  expenseTitle: z.string().trim().min(3, 'Expense title must be at least 3 characters').max(150),
  expenseCategory: z.string().trim().min(1, 'Expense category is mandatory'),
  expenseDescription: z.string().trim().max(1000).optional().default(''),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  isDraft: z.coerce.boolean().optional().default(false),
});

export const updateDraftSchema = z.object({
  voucherDate: z.string().or(z.date()).optional(),
  expenseDate: z.string().or(z.date()).optional(),
  department: z.string().trim().min(1, 'Department cannot be empty').optional(),
  expenseTitle: z.string().trim().min(3, 'Expense title must be at least 3 characters').max(150).optional(),
  expenseCategory: z.string().trim().min(1, 'Expense category cannot be empty').optional(),
  expenseDescription: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
});

export const rejectVoucherSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, 'Rejection reason is mandatory and must be at least 3 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters'),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type RejectVoucherInput = z.infer<typeof rejectVoucherSchema>;

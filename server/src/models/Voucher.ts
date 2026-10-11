import mongoose, { Schema, Document } from 'mongoose';
import { VoucherStatus } from '../types/index.js';

export interface IVoucherDocument extends Document {
  voucherNumber: string;
  voucherDate: Date;
  expenseDate: Date;
  department: string;
  expenseTitle: string;
  expenseCategory: string;
  expenseDescription: string;
  amount: number; // In minor units (paise/cents, integer >= 1)
  employeeId: mongoose.Types.ObjectId;
  employeeSignaturePath?: string;
  directorSignaturePath?: string;
  status: VoucherStatus;
  rejectionReason?: string;
  submittedAt?: Date;
  approvalDate?: Date;
  reviewedById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucherDocument>(
  {
    voucherNumber: {
      type: String,
      required: [true, 'Voucher number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    voucherDate: {
      type: Date,
      required: [true, 'Voucher date is required'],
      default: Date.now,
      index: true,
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    expenseTitle: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
      index: true,
    },
    expenseCategory: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
      index: true,
    },
    expenseDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'], // In paise, so >= 1
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID reference is required'],
      index: true,
    },
    employeeSignaturePath: {
      type: String,
      trim: true,
    },
    directorSignaturePath: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(VoucherStatus),
      default: VoucherStatus.DRAFT,
      required: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    submittedAt: {
      type: Date,
    },
    approvalDate: {
      type: Date,
    },
    reviewedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for frequent searches and filters
VoucherSchema.index({ status: 1, createdAt: -1 });
VoucherSchema.index({ employeeId: 1, status: 1 });
VoucherSchema.index({ department: 1, expenseCategory: 1 });
VoucherSchema.index({ voucherDate: -1 });

export const Voucher = mongoose.model<IVoucherDocument>('Voucher', VoucherSchema);

import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction, VoucherStatus } from '../types/index.js';

export interface IAuditLogDocument extends Document {
  actorId: mongoose.Types.ObjectId;
  voucherId?: mongoose.Types.ObjectId;
  voucherNumber?: string;
  action: AuditAction;
  previousStatus?: VoucherStatus;
  newStatus?: VoucherStatus;
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'Voucher',
      index: true,
    },
    voucherNumber: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: Object.values(VoucherStatus),
    },
    newStatus: {
      type: String,
      enum: Object.values(VoucherStatus),
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ voucherId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

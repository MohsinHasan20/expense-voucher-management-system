import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { AuditAction, VoucherStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface LogAuditEventParams {
  actorId: string | mongoose.Types.ObjectId;
  voucherId?: string | mongoose.Types.ObjectId;
  voucherNumber?: string;
  action: AuditAction;
  previousStatus?: VoucherStatus;
  newStatus?: VoucherStatus;
  details?: Record<string, any>;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(params.actorId),
      voucherId: params.voucherId ? new mongoose.Types.ObjectId(params.voucherId) : undefined,
      voucherNumber: params.voucherNumber,
      action: params.action,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      details: params.details,
    });
  } catch (error) {
    // Non-blocking error logging for audit logs so core transactions aren't broken if logging fails
    logger.error('Failed to write audit log entry:', error);
  }
}

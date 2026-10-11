export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  DIRECTOR = 'DIRECTOR',
  ACCOUNTS = 'ACCOUNTS',
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  employeeId?: string;
  department?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoucher {
  _id: string;
  voucherNumber: string;
  voucherDate: Date;
  expenseDate: Date;
  department: string;
  expenseTitle: string;
  expenseCategory: string;
  expenseDescription: string;
  amount: number; // Stored in minor units (paise/cents, integer >= 1)
  employeeId: string;
  employeeSignaturePath?: string;
  directorSignaturePath?: string;
  status: VoucherStatus;
  rejectionReason?: string;
  submittedAt?: Date;
  approvalDate?: Date;
  reviewedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  actorId: string;
  voucherId: string;
  action: AuditAction;
  previousStatus?: VoucherStatus;
  newStatus?: VoucherStatus;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VoucherFilters extends PaginationParams {
  voucherNumber?: string;
  employeeName?: string;
  department?: string;
  expenseCategory?: string;
  status?: VoucherStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

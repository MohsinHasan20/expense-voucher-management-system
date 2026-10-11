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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
}

export interface Voucher {
  _id: string;
  voucherNumber: string;
  voucherDate: string;
  expenseDate: string;
  department: string;
  expenseTitle: string;
  expenseCategory: string;
  expenseDescription: string;
  amount: number; // in minor units (paise)
  employeeId: {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
    department?: string;
  };
  employeeSignaturePath?: string;
  directorSignaturePath?: string;
  status: VoucherStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvalDate?: string;
  reviewedById?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  voucherId?: string;
  voucherNumber?: string;
  action: AuditAction;
  previousStatus?: VoucherStatus;
  newStatus?: VoucherStatus;
  details?: Record<string, any>;
  createdAt: string;
}

export interface VoucherFilterParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  voucherNumber?: string;
  employeeName?: string;
  department?: string;
  expenseCategory?: string;
  status?: VoucherStatus | '';
  startDate?: string;
  endDate?: string;
  minAmount?: number | '';
  maxAmount?: number | '';
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

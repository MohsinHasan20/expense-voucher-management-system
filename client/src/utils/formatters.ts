import { format } from 'date-fns';
import { VoucherStatus } from '../types';

export function toMajorUnits(minorUnits: number): number {
  if (typeof minorUnits !== 'number' || isNaN(minorUnits)) {
    return 0;
  }
  return Number((minorUnits / 100).toFixed(2));
}

export function formatCurrency(minorUnits: number, currency = 'INR'): string {
  const major = toMajorUnits(minorUnits);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
}

export function getStatusDetails(status: VoucherStatus) {
  switch (status) {
    case VoucherStatus.DRAFT:
      return {
        label: 'Draft',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-700',
        borderClass: 'border-slate-300',
        dotClass: 'bg-slate-400',
      };
    case VoucherStatus.PENDING_APPROVAL:
      return {
        label: 'Pending Approval',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-300',
        dotClass: 'bg-amber-500',
      };
    case VoucherStatus.APPROVED:
      return {
        label: 'Approved',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-800',
        borderClass: 'border-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    case VoucherStatus.REJECTED:
      return {
        label: 'Rejected',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-800',
        borderClass: 'border-rose-300',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-700',
        borderClass: 'border-gray-300',
        dotClass: 'bg-gray-400',
      };
  }
}

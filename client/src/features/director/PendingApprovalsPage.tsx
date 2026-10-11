import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { directorService } from '../../services/directorService';
import { VoucherFiltersBar } from '../../components/common/VoucherFiltersBar';
import { Pagination } from '../../components/common/Pagination';
import { SignatureModal } from '../../components/common/SignatureModal';
import { RejectModal } from '../../components/common/RejectModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { VoucherFilterParams, Voucher } from '../../types';
import { useToast } from '../../context/ToastContext';

export const PendingApprovalsPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<VoucherFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
  });

  const [approveTarget, setApproveTarget] = useState<Voucher | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Voucher | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pendingVouchers', filters],
    queryFn: () => directorService.getPendingVouchers(filters),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, signatureFile }: { id: string; signatureFile: File }) =>
      directorService.approveVoucher(id, signatureFile),
    onSuccess: (res) => {
      success(`Voucher ${res.voucher.voucherNumber} approved successfully.`);
      queryClient.invalidateQueries({ queryKey: ['pendingVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['directorDashboard'] });
      setApproveTarget(null);
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to approve voucher.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      directorService.rejectVoucher(id, reason),
    onSuccess: (res) => {
      success(`Voucher ${res.voucher.voucherNumber} rejected.`);
      queryClient.invalidateQueries({ queryKey: ['pendingVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['directorDashboard'] });
      setRejectTarget(null);
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to reject voucher.');
    },
  });

  const handleFilterChange = (newFilters: Partial<VoucherFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: '',
      department: '',
      expenseCategory: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pending Approvals Queue</span>
            {data && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {data.total}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review submitted reimbursement claims. Approvals require your Director signature.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <VoucherFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        showStatusFilter={false} // All items here are pending approval
      />

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Fetching pending approval vouchers..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Error loading pending vouchers</p>
            <p className="text-xs text-slate-400 mt-1">Please try refreshing the page.</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no vouchers awaiting executive decision.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Claimant</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Expense Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 whitespace-nowrap">
                        {v.voucherNumber}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block leading-tight">
                          {v.employeeId?.name || 'Employee'}
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-tight">
                          {v.employeeId?.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {v.department}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {v.expenseTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(v.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(v.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/vouchers/${v._id}`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                            title="Inspect Details & Signatures"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setApproveTarget(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition"
                            title="Approve Voucher"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectTarget(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-sm transition"
                            title="Reject Voucher"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              limit={data.limit}
              onPageChange={(page) => handleFilterChange({ page })}
              onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
            />
          </>
        )}
      </div>

      {/* Approve Modal (Requires Director Signature Upload) */}
      <SignatureModal
        isOpen={!!approveTarget}
        title={`Approve Voucher ${approveTarget?.voucherNumber}`}
        description="Your Director signature is required to authorize this expense voucher. Upload a PNG/JPEG image or draw on screen."
        onSave={(sigFile) => {
          if (approveTarget) {
            approveMutation.mutate({ id: approveTarget._id, signatureFile: sigFile });
          }
        }}
        onClose={() => setApproveTarget(null)}
      />

      {/* Reject Modal (Requires Mandatory Justification) */}
      <RejectModal
        isOpen={!!rejectTarget}
        voucherNumber={rejectTarget?.voucherNumber || ''}
        isLoading={rejectMutation.isPending}
        onReject={(reason) => {
          if (rejectTarget) {
            rejectMutation.mutate({ id: rejectTarget._id, reason });
          }
        }}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { VoucherFiltersBar } from '../../components/common/VoucherFiltersBar';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { VoucherFilterParams, VoucherStatus, Voucher } from '../../types';
import { useToast } from '../../context/ToastContext';

export const MyVouchersPage: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<VoucherFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myVouchers', filters],
    queryFn: () => voucherService.getMyVouchers(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voucherService.deleteDraftVoucher(id),
    onSuccess: () => {
      success('Draft voucher deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['myVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to delete draft voucher.');
      setDeleteTarget(null);
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
      status: '',
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Expense Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, track, and manage all reimbursement claims submitted by your account.
          </p>
        </div>

        <Link
          to="/employee/create-voucher"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Voucher</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <VoucherFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        showStatusFilter={true}
      />

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Fetching your expense vouchers..." />
        ) : isError || !data ? (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Error loading vouchers</p>
            <p className="text-xs text-slate-400 mt-1">Please try refreshing the page.</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No vouchers match your criteria</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search or filters, or create a new expense voucher.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Expense Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 whitespace-nowrap">
                        {v.voucherNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {v.expenseTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {v.department}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium">
                          {v.expenseCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(v.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(v.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={v.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/vouchers/${v._id}`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                            title="View Voucher Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {v.status === VoucherStatus.DRAFT && (
                            <>
                              <Link
                                to={`/employee/edit-voucher/${v._id}`}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                                title="Edit Draft Voucher"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteTarget(v)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition"
                                title="Delete Draft Voucher"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Draft Voucher"
        message={`Are you sure you want to permanently delete draft voucher "${deleteTarget?.voucherNumber}" (${deleteTarget?.expenseTitle})? This action cannot be undone.`}
        confirmLabel="Delete Voucher"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

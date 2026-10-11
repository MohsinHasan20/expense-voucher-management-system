import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  PlusCircle,
  FileEdit,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['employeeDashboard'],
    queryFn: () => voucherService.getEmployeeDashboard(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard statistics..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load employee dashboard data. Please try again.
      </div>
    );
  }

  const { metrics, recentVouchers } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.department || 'Staff'})
          </p>
        </div>

        <Link
          to="/employee/create-voucher"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Expense Voucher</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Vouchers"
          value={metrics.totalVouchers}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Drafts"
          value={metrics.draftVouchers}
          icon={FileEdit}
          variant="default"
        />
        <StatCard
          title="Pending Approval"
          value={metrics.pendingApproval}
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Approved"
          value={metrics.approvedVouchers}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Rejected"
          value={metrics.rejectedVouchers}
          icon={XCircle}
          variant="rose"
        />
        <StatCard
          title="Total Claimed"
          value={formatCurrency(metrics.totalClaimedAmount * 100)}
          subtitle="Submitted / Approved"
          icon={IndianRupee}
          variant="navy"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Vouchers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your latest 5 expense voucher claims</p>
          </div>
          <Link
            to="/employee/my-vouchers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentVouchers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No vouchers created yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You haven&apos;t filed any reimbursement vouchers. Click below to start your first voucher.
            </p>
            <Link
              to="/employee/create-voucher"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create First Voucher
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Expense Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentVouchers.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                      {v.voucherNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {v.expenseTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">
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
                      <Link
                        to={`/vouchers/${v._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

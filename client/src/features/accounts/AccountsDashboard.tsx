import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Eye,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { accountsService } from '../../services/accountsService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AccountsDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accountsDashboard'],
    queryFn: () => accountsService.getAccountsDashboard(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading finance accounts dashboard..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load Accounts dashboard. Please try again.
      </div>
    );
  }

  const { metrics, recentApprovedVouchers } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Accounts & Finance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor verified expenses and process employee reimbursement disbursements.
          </p>
        </div>

        <Link
          to="/accounts/all-vouchers"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <FileText className="w-4 h-4" />
          <span>All Vouchers Registry</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Vouchers"
          value={metrics.totalVouchers}
          subtitle="All recorded claims"
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Pending Director"
          value={metrics.pendingApproval}
          subtitle="Awaiting authorization"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Approved Claims"
          value={metrics.approvedVouchers}
          subtitle="Ready for reimbursement"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Rejected Claims"
          value={metrics.rejectedVouchers}
          subtitle="Declined claims"
          icon={XCircle}
          variant="rose"
        />
        <StatCard
          title="Total Approved Expense"
          value={formatCurrency(metrics.totalApprovedExpenseAmount * 100)}
          subtitle="Authorized reimbursement pool"
          icon={IndianRupee}
          variant="navy"
        />
      </div>

      {/* Recent Approved Vouchers (Disbursement Queue) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Approved Claims for Reimbursement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified by Director with signature authorization
            </p>
          </div>
          <Link
            to="/accounts/all-vouchers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApprovedVouchers.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 text-xs">
            No approved vouchers currently awaiting reimbursement disbursement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Beneficiary / Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Approval Date</th>
                  <th className="py-3 px-4 text-right">Approved Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApprovedVouchers.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 whitespace-nowrap">
                      {v.voucherNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block leading-tight">
                        {v.employeeId?.name || 'Employee'}
                      </span>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        {v.employeeId?.employeeId || v.employeeId?.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {v.department}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {v.expenseTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(v.approvalDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 text-right whitespace-nowrap">
                      {formatCurrency(v.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/vouchers/${v._id}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                          title="View Details & Signatures"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/vouchers/${v._id}/print`}
                          target="_blank"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                          title="Print Official Reimbursement Voucher"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
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

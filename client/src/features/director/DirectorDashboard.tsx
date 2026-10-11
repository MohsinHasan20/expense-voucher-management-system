import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Eye,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { directorService } from '../../services/directorService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING_APPROVAL: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

export const DirectorDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['directorDashboard'],
    queryFn: () => directorService.getDirectorDashboard(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading executive analytics and pending queue..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load Director executive dashboard. Please try again.
      </div>
    );
  }

  const { metrics, statusBreakdown, recentActivity } = data;

  const chartData = statusBreakdown.map((item) => ({
    name: item.status.replace('_', ' '),
    rawStatus: item.status,
    count: item.count,
    amount: item.totalAmount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Director Approval Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Executive oversight, authorization decisions, and company expense governance.
          </p>
        </div>

        <Link
          to="/director/pending"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({metrics.pendingApprovalCount})</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={metrics.pendingApprovalCount}
          subtitle="Vouchers awaiting decision"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Total Pending Amount"
          value={formatCurrency(metrics.totalPendingAmount * 100)}
          subtitle="Value in approval queue"
          icon={IndianRupee}
          variant="navy"
        />
        <StatCard
          title="Approved Today"
          value={metrics.approvedToday}
          subtitle="Decisions made today"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Rejected Today"
          value={metrics.rejectedToday}
          subtitle="Declined claims today"
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* Chart and Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Voucher Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Claims breakdown across lifecycle states</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No vouchers recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value} vouchers`, 'Volume']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.rawStatus] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Submissions and Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Voucher Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest claims submitted or processed in the organization
              </p>
            </div>
            <Link
              to="/director/all-vouchers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No recent voucher activity found.
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Claimant</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-navy-900 whitespace-nowrap">
                        {v.voucherNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                        <span className="font-semibold block leading-none">{v.employeeId?.name || 'Employee'}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-none">
                          {v.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {v.expenseTitle}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(v.amount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={v.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Link
                          to={`/vouchers/${v._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

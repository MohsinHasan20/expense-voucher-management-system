import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
import { VoucherStatus, VoucherFilterParams } from '../../types';

interface VoucherFiltersBarProps {
  filters: VoucherFilterParams;
  onFilterChange: (newFilters: Partial<VoucherFilterParams>) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
}

const DEPARTMENTS = [
  'Information Technology',
  'Finance & Accounts',
  'Human Resources',
  'Operations',
  'Marketing',
  'Sales',
  'Executive Management',
];

const CATEGORIES = [
  'Travel',
  'Accommodation',
  'Meals',
  'Office Supplies',
  'Transportation',
  'Communication',
  'Other',
];

export const VoucherFiltersBar: React.FC<VoucherFiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  showStatusFilter = true,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const handleClear = () => {
    setSearchTerm('');
    onReset();
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.department ||
      filters.expenseCategory ||
      filters.startDate ||
      filters.endDate ||
      filters.minAmount ||
      filters.maxAmount
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5">
      {/* Primary search bar & toggles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by voucher #, title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
              isExpanded || hasActiveFilters
                ? 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Advanced Filters' : 'Advanced Filters'}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-600 ml-0.5" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded filters tray */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => onFilterChange({ status: e.target.value as any, page: 1 })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Statuses</option>
                <option value={VoucherStatus.DRAFT}>Draft</option>
                <option value={VoucherStatus.PENDING_APPROVAL}>Pending Approval</option>
                <option value={VoucherStatus.APPROVED}>Approved</option>
                <option value={VoucherStatus.REJECTED}>Rejected</option>
              </select>
            </div>
          )}

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={filters.department || ''}
              onChange={(e) => onFilterChange({ department: e.target.value, page: 1 })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Category</label>
            <select
              value={filters.expenseCategory || ''}
              onChange={(e) => onFilterChange({ expenseCategory: e.target.value, page: 1 })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By & Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sort By</label>
            <div className="flex items-center gap-1.5">
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => onFilterChange({ sortBy: e.target.value, page: 1 })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="createdAt">Date Created</option>
                <option value="voucherDate">Voucher Date</option>
                <option value="expenseDate">Expense Date</option>
                <option value="amount">Amount</option>
                <option value="voucherNumber">Voucher Number</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                    page: 1,
                  })
                }
                title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-slate-600"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Date Range: From */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Date From</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Date To</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Min Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={filters.minAmount ?? ''}
              onChange={(e) =>
                onFilterChange({
                  minAmount: e.target.value ? Number(e.target.value) : '',
                  page: 1,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Max Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={filters.maxAmount ?? ''}
              onChange={(e) =>
                onFilterChange({
                  maxAmount: e.target.value ? Number(e.target.value) : '',
                  page: 1,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

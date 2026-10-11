import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Building2 } from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const PrintVoucherView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['voucherPrint', id],
    queryFn: () => voucherService.getVoucherById(id!),
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LoadingSpinner message="Preparing printable voucher document..." />;
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-rose-600">
        Failed to load voucher for printing.
      </div>
    );
  }

  const { voucher } = data;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      {/* Floating Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Voucher / Save as PDF</span>
        </button>
      </div>

      {/* Official A4 Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-md p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Company Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-navy-900 text-white rounded-lg">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-900">
                  Prachay Securities Private Limited
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Corporate Finance & Accounts Department
                </p>
                <p className="text-[11px] text-slate-400">
                  Registration No: PSPL-CORP-2026 | Financial Year: 2026–2027
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Official Voucher
              </span>
              <span className="text-lg font-mono font-bold text-navy-900">
                {voucher.voucherNumber}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Status: <strong>{voucher.status}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-6">
          <h2 className="text-base font-bold uppercase tracking-wider underline decoration-2 underline-offset-4 text-slate-900">
            Expense Reimbursement Claim Voucher
          </h2>
        </div>

        {/* Metadata Table */}
        <div className="grid grid-cols-2 border border-slate-300 text-xs mb-6">
          <div className="p-3 border-r border-b border-slate-300 bg-slate-50 font-semibold">
            Claimant Name
          </div>
          <div className="p-3 border-b border-slate-300">
            {voucher.employeeId?.name} ({voucher.employeeId?.email})
          </div>

          <div className="p-3 border-r border-b border-slate-300 bg-slate-50 font-semibold">
            Employee ID & Dept
          </div>
          <div className="p-3 border-b border-slate-300">
            {voucher.employeeId?.employeeId || 'N/A'} — {voucher.department}
          </div>

          <div className="p-3 border-r border-b border-slate-300 bg-slate-50 font-semibold">
            Voucher Date
          </div>
          <div className="p-3 border-b border-slate-300">
            {formatDate(voucher.voucherDate)}
          </div>

          <div className="p-3 border-r border-slate-300 bg-slate-50 font-semibold">
            Expense Date & Category
          </div>
          <div className="p-3">
            {formatDate(voucher.expenseDate)} ({voucher.expenseCategory})
          </div>
        </div>

        {/* Expense Items Breakdown Table */}
        <table className="w-full text-xs border border-slate-300 mb-6">
          <thead className="bg-slate-100 font-bold border-b border-slate-300">
            <tr>
              <th className="p-2.5 text-left border-r border-slate-300 w-12">#</th>
              <th className="p-2.5 text-left border-r border-slate-300">Particulars / Expense Description</th>
              <th className="p-2.5 text-left border-r border-slate-300 w-32">Category</th>
              <th className="p-2.5 text-right w-36">Claimed Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-3 border-r border-slate-300 text-center font-mono">1</td>
              <td className="p-3 border-r border-slate-300">
                <span className="font-bold text-slate-900 block">{voucher.expenseTitle}</span>
                {voucher.expenseDescription && (
                  <span className="text-slate-600 text-[11px] mt-1 block">
                    {voucher.expenseDescription}
                  </span>
                )}
              </td>
              <td className="p-3 border-r border-slate-300">{voucher.expenseCategory}</td>
              <td className="p-3 text-right font-mono font-bold text-slate-900">
                {formatCurrency(voucher.amount)}
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
            <tr>
              <td colSpan={3} className="p-3 text-right border-r border-slate-300 uppercase">
                Total Approved Payable Amount:
              </td>
              <td className="p-3 text-right font-mono text-sm font-extrabold text-navy-900">
                {formatCurrency(voucher.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures & Authorizations Box */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 mt-8">
          {/* Employee Box */}
          <div className="border border-slate-300 p-4 rounded text-center">
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-600 mb-2">
              Claimant Employee Signature
            </span>
            <div className="h-24 flex items-center justify-center p-2">
              {voucher.employeeSignaturePath ? (
                <img
                  src={voucherService.getSignatureUrl(voucher.employeeSignaturePath)}
                  alt="Employee Signature"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">Not signed</span>
              )}
            </div>
            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 font-medium">
              Name: {voucher.employeeId?.name}
              {voucher.submittedAt && (
                <span className="block text-[10px]">Date: {formatDate(voucher.submittedAt)}</span>
              )}
            </div>
          </div>

          {/* Director Box */}
          <div className="border border-slate-300 p-4 rounded text-center">
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-600 mb-2">
              Director Executive Authorization
            </span>
            <div className="h-24 flex items-center justify-center p-2">
              {voucher.directorSignaturePath ? (
                <img
                  src={voucherService.getSignatureUrl(voucher.directorSignaturePath)}
                  alt="Director Signature"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">
                  {voucher.status === 'APPROVED' ? 'Digitally Verified' : 'Pending Authorization'}
                </span>
              )}
            </div>
            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 font-medium">
              Approved by: {voucher.reviewedById?.name || 'Managing Director'}
              {voucher.approvalDate && (
                <span className="block text-[10px]">
                  Date: {formatDate(voucher.approvalDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Audit Stamp */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Generated automatically by PSPL Expense Voucher Management System on{' '}
          {formatDateTime(new Date())}. Official Company Record.
        </div>
      </div>
    </div>
  );
};

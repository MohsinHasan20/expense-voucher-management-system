import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Printer,
  History,
  Clock,
  ShieldCheck,
  Edit3,
  Send,
  Trash2,
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { directorService } from '../../services/directorService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SignatureModal } from '../../components/common/SignatureModal';
import { RejectModal } from '../../components/common/RejectModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../utils/formatters';
import { UserRole, VoucherStatus } from '../../types';

export const VoucherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['voucherDetail', id],
    queryFn: () => voucherService.getVoucherById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (signatureFile: File) => directorService.approveVoucher(id!, signatureFile),
    onSuccess: () => {
      success('Voucher approved with your Director signature.');
      queryClient.invalidateQueries({ queryKey: ['voucherDetail', id] });
      setIsApproveModalOpen(false);
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to approve voucher.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => directorService.rejectVoucher(id!, reason),
    onSuccess: () => {
      success('Voucher has been rejected.');
      queryClient.invalidateQueries({ queryKey: ['voucherDetail', id] });
      setIsRejectModalOpen(false);
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to reject voucher.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => voucherService.deleteDraftVoucher(id!),
    onSuccess: () => {
      success('Draft voucher deleted.');
      navigate('/employee/my-vouchers');
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to delete voucher.'),
  });

  const submitMutation = useMutation({
    mutationFn: (signatureFile?: File) => voucherService.submitVoucher(id!, signatureFile),
    onSuccess: () => {
      success('Draft submitted for Director approval.');
      queryClient.invalidateQueries({ queryKey: ['voucherDetail', id] });
      setIsSubmitModalOpen(false);
    },
    onError: (err: any) => error(err.response?.data?.message || 'Failed to submit voucher.'),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading voucher details and signatures..." />;
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Voucher Not Found or Access Forbidden</h2>
        <p className="text-xs text-slate-500 mt-1">
          You might not have permission to view this document, or it has been removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { voucher, auditLogs } = data;
  const isOwner = user?.id === voucher.employeeId?._id;
  const isDirector = user?.role === UserRole.DIRECTOR;
  const isPending = voucher.status === VoucherStatus.PENDING_APPROVAL;
  const isDraft = voucher.status === VoucherStatus.DRAFT;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 no-print">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/vouchers/${voucher._id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Voucher</span>
          </Link>

          {/* Director Actions on Pending Voucher */}
          {isDirector && isPending && (
            <>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Employee Actions on Draft Voucher */}
          {isOwner && isDraft && (
            <>
              <Link
                to={`/employee/edit-voucher/${voucher._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Draft</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Voucher Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Voucher Title Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
                {voucher.voucherNumber}
              </span>
              <StatusBadge status={voucher.status} />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-200 mt-1">
              {voucher.expenseTitle}
            </h1>
          </div>

          <div className="text-left sm:text-right bg-slate-800/80 sm:bg-transparent p-3 sm:p-0 rounded-lg">
            <span className="text-xs text-slate-400 block font-medium">Claim Amount</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(voucher.amount)}
            </span>
          </div>
        </div>

        {/* Rejection Alert Banner (if rejected) */}
        {voucher.status === VoucherStatus.REJECTED && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Voucher Rejected by Director
              </p>
              <p className="text-xs sm:text-sm text-rose-800 mt-1 font-medium leading-relaxed">
                {voucher.rejectionReason}
              </p>
              {voucher.reviewedById && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Reviewed by: {voucher.reviewedById.name} ({voucher.reviewedById.email})
                </p>
              )}
            </div>
          </div>
        )}

        {/* Approval Alert Banner (if approved) */}
        {voucher.status === VoucherStatus.APPROVED && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Authorized for Reimbursement Disbursement
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Approved on {formatDateTime(voucher.approvalDate)}{' '}
                {voucher.reviewedById && `by ${voucher.reviewedById.name}`}
              </p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Claimant Name
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                {voucher.employeeId?.name}
              </span>
              <span className="text-xs text-slate-500 truncate block">
                {voucher.employeeId?.email}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Department
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {voucher.department}
              </span>
              <span className="text-xs text-slate-500 block">
                ID: {voucher.employeeId?.employeeId || 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Category
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {voucher.expenseCategory}
              </span>
              <span className="text-xs text-slate-500 block">
                Expense Date: {formatDate(voucher.expenseDate)}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Timeline
              </span>
              <span className="text-xs text-slate-700 block">
                Created: {formatDate(voucher.createdAt)}
              </span>
              <span className="text-xs text-slate-700 block">
                Submitted:{' '}
                {voucher.submittedAt ? formatDate(voucher.submittedAt) : 'Pending Draft'}
              </span>
            </div>
          </div>

          {/* Business Justification */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Expense Description & Justification
            </h3>
            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {voucher.expenseDescription || 'No additional description provided.'}
            </div>
          </div>

          {/* Signatures Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Official Signatures & Authorizations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Employee Signature */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Claimant Signature</span>
                  {voucher.employeeSignaturePath ? (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                  )}
                </div>

                <div className="h-32 border border-slate-200 rounded-lg bg-white p-2 flex items-center justify-center">
                  {voucher.employeeSignaturePath ? (
                    <img
                      src={voucherService.getSignatureUrl(voucher.employeeSignaturePath)}
                      alt="Employee Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No signature attached yet
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  {voucher.employeeId?.name}
                </p>
              </div>

              {/* Director Signature */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Director Authorization</span>
                  {voucher.directorSignaturePath ? (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : voucher.status === VoucherStatus.REJECTED ? (
                    <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Awaiting Review
                    </span>
                  )}
                </div>

                <div className="h-32 border border-slate-200 rounded-lg bg-white p-2 flex items-center justify-center">
                  {voucher.directorSignaturePath ? (
                    <img
                      src={voucherService.getSignatureUrl(voucher.directorSignaturePath)}
                      alt="Director Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {voucher.status === VoucherStatus.REJECTED
                        ? 'Claim was rejected'
                        : 'Awaiting Director review & signature'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  {voucher.reviewedById?.name || 'Authorized Signatory'}
                </p>
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Immutable Audit Trail History
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">
                  No historical logs recorded.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id} className="p-3.5 flex items-start justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {log.actorId?.name || 'System User'}
                      </span>{' '}
                      <span className="text-slate-500">
                        performed{' '}
                        <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">
                          {log.action}
                        </code>
                      </span>
                      {log.newStatus && (
                        <span className="ml-1 text-slate-600">
                          (Status: <strong>{log.newStatus}</strong>)
                        </span>
                      )}
                      {log.details?.rejectionReason && (
                        <p className="text-rose-700 mt-1 italic">
                          &ldquo;{log.details.rejectionReason}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-slate-400 whitespace-nowrap ml-4">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Director Approve Modal */}
      <SignatureModal
        isOpen={isApproveModalOpen}
        title={`Approve Voucher ${voucher.voucherNumber}`}
        description="Attach Director signature image or draw on screen to authorize reimbursement."
        onSave={(file) => approveMutation.mutate(file)}
        onClose={() => setIsApproveModalOpen(false)}
      />

      {/* Director Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        voucherNumber={voucher.voucherNumber}
        isLoading={rejectMutation.isPending}
        onReject={(reason) => rejectMutation.mutate(reason)}
        onClose={() => setIsRejectModalOpen(false)}
      />

      {/* Employee Delete Draft Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Delete Draft Voucher"
        message={`Are you sure you want to delete ${voucher.voucherNumber}?`}
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Employee Submit Modal (if signature already exists or needs upload) */}
      {!voucher.employeeSignaturePath ? (
        <SignatureModal
          isOpen={isSubmitModalOpen}
          title="Attach Signature & Submit"
          description="Your signature is required before submitting this voucher for Director review."
          onSave={(file) => submitMutation.mutate(file)}
          onClose={() => setIsSubmitModalOpen(false)}
        />
      ) : (
        <ConfirmDialog
          isOpen={isSubmitModalOpen}
          title="Submit for Approval"
          message="Once submitted, this voucher becomes read-only and will be queued for Director approval. Proceed?"
          confirmLabel="Submit Voucher"
          isLoading={submitMutation.isPending}
          onConfirm={() => submitMutation.mutate()}
          onCancel={() => setIsSubmitModalOpen(false)}
        />
      )}
    </div>
  );
};

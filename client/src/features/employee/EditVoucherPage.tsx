import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Send,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { voucherService } from '../../services/voucherService';
import { SignatureModal } from '../../components/common/SignatureModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { VoucherStatus } from '../../types';
import { toMajorUnits } from '../../utils/formatters';

const CATEGORIES = [
  'Travel',
  'Accommodation',
  'Meals',
  'Office Supplies',
  'Transportation',
  'Communication',
  'Other',
];

const voucherSchema = z.object({
  voucherDate: z.string().min(1, 'Voucher date is required'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  department: z.string().min(1, 'Department is mandatory'),
  expenseTitle: z.string().min(3, 'Expense title must be at least 3 characters').max(150),
  expenseCategory: z.string().min(1, 'Category is mandatory'),
  expenseDescription: z.string().max(1000).optional(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

export const EditVoucherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isLoadingVoucher, setIsLoadingVoucher] = useState(true);
  const [voucherNumber, setVoucherNumber] = useState('');
  const [currentStatus, setCurrentStatus] = useState<VoucherStatus>(VoucherStatus.DRAFT);
  const [existingSignaturePath, setExistingSignaturePath] = useState<string | null>(null);

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
  });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const data = await voucherService.getVoucherById(id!);
        const v = data.voucher;
        setVoucherNumber(v.voucherNumber);
        setCurrentStatus(v.status);
        setExistingSignaturePath(v.employeeSignaturePath || null);

        if (v.employeeSignaturePath) {
          setSignaturePreview(voucherService.getSignatureUrl(v.employeeSignaturePath));
        }

        reset({
          voucherDate: v.voucherDate.split('T')[0],
          expenseDate: v.expenseDate.split('T')[0],
          department: v.department,
          expenseTitle: v.expenseTitle,
          expenseCategory: v.expenseCategory,
          expenseDescription: v.expenseDescription || '',
          amount: toMajorUnits(v.amount),
        });
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load voucher details');
        navigate('/employee/my-vouchers');
      } finally {
        setIsLoadingVoucher(false);
      }
    }
    load();
  }, [id, reset, error, navigate]);

  const handleSignatureSave = (file: File) => {
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (data: VoucherFormData, submitAfterSave: boolean) => {
    if (!id) return;

    if (currentStatus !== VoucherStatus.DRAFT) {
      error(`Cannot edit voucher. Only DRAFT vouchers can be modified (Status: ${currentStatus}).`);
      return;
    }

    if (submitAfterSave && !signatureFile && !existingSignaturePath) {
      error('Employee signature is mandatory before submitting for approval.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('voucherDate', data.voucherDate);
      formData.append('expenseDate', data.expenseDate);
      formData.append('department', data.department);
      formData.append('expenseTitle', data.expenseTitle);
      formData.append('expenseCategory', data.expenseCategory);
      formData.append('expenseDescription', data.expenseDescription || '');
      formData.append('amount', String(data.amount));

      if (signatureFile) {
        formData.append('signature', signatureFile);
      }

      await voucherService.updateDraftVoucher(id, formData);

      if (submitAfterSave) {
        await voucherService.submitVoucher(id);
        success(`Voucher ${voucherNumber} submitted for Director approval!`);
      } else {
        success(`Draft voucher ${voucherNumber} updated successfully.`);
      }

      navigate('/employee/my-vouchers');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingVoucher) {
    return <LoadingSpinner message="Loading draft voucher details..." />;
  }

  if (currentStatus !== VoucherStatus.DRAFT) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-amber-900">Voucher is Read-Only</h2>
        <p className="text-xs text-amber-700">
          This voucher has status <span className="font-semibold">{currentStatus}</span>.
          Under company policy, submitted and reviewed vouchers cannot be edited.
        </p>
        <button
          onClick={() => navigate(`/vouchers/${id}`)}
          className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition"
        >
          View Read-Only Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Vouchers</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Draft Voucher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify draft fields and attach your signature before submitting for review.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Voucher Number</span>
          <span className="text-sm font-mono font-bold text-navy-900 bg-slate-100 px-2 py-1 rounded">
            {voucherNumber}
          </span>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form className="space-y-6">
          {/* Section: Employee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Employee Name</span>
              <span className="font-semibold text-slate-900 text-sm">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Department</span>
              <span className="font-semibold text-slate-900 text-sm">
                {user?.department || 'Staff'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Current Status</span>
              <span className="font-semibold text-slate-900 text-sm">DRAFT</span>
            </div>
          </div>

          {/* Section: Dates and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('department')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              />
              {errors.department && (
                <p className="text-xs text-rose-600 mt-1">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Voucher Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('voucherDate')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              />
              {errors.voucherDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.voucherDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('expenseDate')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              />
              {errors.expenseDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.expenseDate.message}</p>
              )}
            </div>
          </div>

          {/* Section: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expense Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('expenseTitle')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              />
              {errors.expenseTitle && (
                <p className="text-xs text-rose-600 mt-1">{errors.expenseTitle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('expenseCategory')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expense Description
            </label>
            <textarea
              rows={3}
              {...register('expenseDescription')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
            />
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Total Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                className="w-full pl-8 pr-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-900"
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600 mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Signature Upload */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Claimant Signature
            </h2>
            {signaturePreview ? (
              <div className="flex items-center gap-4 p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl max-w-md">
                <img
                  src={signaturePreview}
                  alt="Claimant Signature Preview"
                  className="h-14 w-auto max-w-[160px] object-contain border border-slate-200 bg-white p-1 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Signature Attached</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {signatureFile ? signatureFile.name : 'Stored Signature'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center justify-between p-4 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition max-w-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Attach Employee Signature
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Upload image or draw with stylus
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
                  Select
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => handleUpdate(data, false))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Update Draft</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => handleUpdate(data, true))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </form>
      </div>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        title="Update Employee Signature"
        onSave={handleSignatureSave}
        onClose={() => setIsSignatureModalOpen(false)}
      />
    </div>
  );
};

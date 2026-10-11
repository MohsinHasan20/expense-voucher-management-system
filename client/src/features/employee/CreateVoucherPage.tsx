import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Send,
  UploadCloud,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { voucherService } from '../../services/voucherService';
import { SignatureModal } from '../../components/common/SignatureModal';

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

export const CreateVoucherPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherDate: todayStr,
      expenseDate: todayStr,
      department: user?.department || 'Information Technology',
      expenseCategory: 'Travel',
      expenseDescription: '',
      amount: '' as any,
    },
  });

  const handleSignatureSave = (file: File) => {
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const handleCreate = async (data: VoucherFormData, isDraft: boolean) => {
    // If submitting directly, signature is strictly required
    if (!isDraft && !signatureFile) {
      error('Employee signature is mandatory when submitting for approval.');
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
      formData.append('isDraft', isDraft ? 'true' : 'false');

      if (signatureFile) {
        formData.append('signature', signatureFile);
      }

      const res = await voucherService.createVoucher(formData);

      if (isDraft) {
        success(`Voucher ${res.voucher.voucherNumber} saved as Draft.`);
      } else {
        success(`Voucher ${res.voucher.voucherNumber} submitted for Director approval!`);
      }

      navigate('/employee/my-vouchers');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to process voucher claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Create Expense Voucher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in the details below to claim reimbursement. You can save as a draft or submit directly.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400 block font-medium">Voucher Number</span>
          <span className="text-sm font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            Auto-Generated (EV-YYYY-XXXX)
          </span>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form className="space-y-6">
          {/* Section: Employee Information */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Claimant Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Employee Name</span>
                <span className="font-semibold text-slate-900 text-sm">{user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Employee ID</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {user?.employeeId || 'EMP-PSPL'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Corporate Email</span>
                <span className="font-semibold text-slate-900 text-sm truncate block">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Voucher Dates & Department */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Basic Voucher Details
            </h2>
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
          </div>

          {/* Section: Expense Specifics */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. Expense Item Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Expense Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel tickets to Pune branch audit"
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
                {errors.expenseCategory && (
                  <p className="text-xs text-rose-600 mt-1">{errors.expenseCategory.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expense Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide detailed breakdown or business justification for this expense claim..."
                {...register('expenseDescription')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-800"
              />
            </div>

            <div className="mt-4 max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Claim Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                  className="w-full pl-8 pr-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 text-slate-900"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-600 mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Section: Employee Signature Upload */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              4. Claimant Signature
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Mandatory before submitting for Director approval (optional for drafts).
            </p>

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
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{signatureFile?.name}</p>
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
                className="flex items-center justify-between p-4 border border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50/80 cursor-pointer transition max-w-md"
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
              onClick={handleSubmit((data) => handleCreate(data, true))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => handleCreate(data, false))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </form>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        title="Attach Employee Signature"
        description="Attach a PNG/JPEG image (max 2 MB) or draw your signature."
        onSave={handleSignatureSave}
        onClose={() => setIsSignatureModalOpen(false)}
      />
    </div>
  );
};

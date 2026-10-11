import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'employee@pspl.com',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const loggedUser = await login(data.email, data.password);
      success(`Welcome back, ${loggedUser.name}!`);

      const destination = (location.state as any)?.from?.pathname;
      if (destination) {
        navigate(destination, { replace: true });
        return;
      }

      if (loggedUser.role === UserRole.EMPLOYEE) {
        navigate('/employee/dashboard');
      } else if (loggedUser.role === UserRole.DIRECTOR) {
        navigate('/director/dashboard');
      } else if (loggedUser.role === UserRole.ACCOUNTS) {
        navigate('/accounts/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-navy-900 text-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Prachay Securities
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Expense Voucher Management System
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Sign In to Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access your designated corporate workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@pspl.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Accounts (Evaluation)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('employee@pspl.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700">Employee</span>
                <span className="text-[9px] text-slate-400">Creation</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('director@pspl.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700">Director</span>
                <span className="text-[9px] text-slate-400">Approvals</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('accounts@pspl.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-center"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700">Accounts</span>
                <span className="text-[9px] text-slate-400">Audit / View</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Default password for all demo accounts: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">Password123!</code>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Protected with HTTP-only tokens, bcrypt, and role authorization</span>
        </div>
      </div>
    </div>
  );
};

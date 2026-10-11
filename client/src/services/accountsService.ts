import { api } from './api';
import { Voucher, VoucherFilterParams, PaginatedResponse } from '../types';

export const accountsService = {
  async getAccountsDashboard(): Promise<{
    metrics: {
      totalVouchers: number;
      pendingApproval: number;
      approvedVouchers: number;
      rejectedVouchers: number;
      totalApprovedExpenseAmount: number;
    };
    recentApprovedVouchers: Voucher[];
  }> {
    const response = await api.get('/accounts/dashboard');
    return response.data;
  },

  async getAllVouchers(params: VoucherFilterParams): Promise<PaginatedResponse<Voucher>> {
    const response = await api.get('/accounts/vouchers', { params });
    return response.data;
  },
};

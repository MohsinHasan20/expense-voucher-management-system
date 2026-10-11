import { api } from './api';
import { Voucher, VoucherFilterParams, PaginatedResponse } from '../types';

export const directorService = {
  async getDirectorDashboard(): Promise<{
    metrics: {
      totalVouchers: number;
      pendingApprovalCount: number;
      approvedToday: number;
      rejectedToday: number;
      totalPendingAmount: number;
    };
    statusBreakdown: Array<{
      status: string;
      count: number;
      totalAmount: number;
    }>;
    recentActivity: Voucher[];
  }> {
    const response = await api.get('/director/dashboard');
    return response.data;
  },

  async getAllVouchers(params: VoucherFilterParams): Promise<PaginatedResponse<Voucher>> {
    const response = await api.get('/director/vouchers', { params });
    return response.data;
  },

  async getPendingVouchers(params: VoucherFilterParams): Promise<PaginatedResponse<Voucher>> {
    const response = await api.get('/director/vouchers/pending', { params });
    return response.data;
  },

  async approveVoucher(id: string, signatureFile: File): Promise<{ voucher: Voucher }> {
    const formData = new FormData();
    formData.append('signature', signatureFile);
    const response = await api.post(`/director/vouchers/${id}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async rejectVoucher(id: string, rejectionReason: string): Promise<{ voucher: Voucher }> {
    const response = await api.post(`/director/vouchers/${id}/reject`, {
      rejectionReason,
    });
    return response.data;
  },
};

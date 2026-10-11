import { api, API_BASE_URL } from './api';
import { Voucher, VoucherFilterParams, PaginatedResponse, AuditLogItem } from '../types';

export const voucherService = {
  async createVoucher(formData: FormData): Promise<{ voucher: Voucher }> {
    const response = await api.post('/vouchers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getMyVouchers(params: VoucherFilterParams): Promise<PaginatedResponse<Voucher>> {
    const response = await api.get('/vouchers/my', { params });
    return response.data;
  },

  async getVoucherById(id: string): Promise<{ voucher: Voucher; auditLogs: AuditLogItem[] }> {
    const response = await api.get(`/vouchers/${id}`);
    return response.data;
  },

  async updateDraftVoucher(id: string, formData: FormData): Promise<{ voucher: Voucher }> {
    const response = await api.patch(`/vouchers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteDraftVoucher(id: string): Promise<void> {
    await api.delete(`/vouchers/${id}`);
  },

  async submitVoucher(id: string, signatureFile?: File): Promise<{ voucher: Voucher }> {
    const formData = new FormData();
    if (signatureFile) {
      formData.append('signature', signatureFile);
    }
    const response = await api.post(`/vouchers/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getEmployeeDashboard(): Promise<{
    metrics: {
      totalVouchers: number;
      draftVouchers: number;
      pendingApproval: number;
      approvedVouchers: number;
      rejectedVouchers: number;
      totalClaimedAmount: number;
      totalDraftAmount: number;
    };
    recentVouchers: Voucher[];
  }> {
    const response = await api.get('/vouchers/dashboard');
    return response.data;
  },

  getSignatureUrl(filename: string): string {
    return `${API_BASE_URL}/signatures/${filename}`;
  },
};

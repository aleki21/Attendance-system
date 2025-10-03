import api from './authService';

export interface AdminStats {
  totalMembers: number;
  totalUsers: number;
  totalEvents: number;
  activeUshers: number;
}

export const adminService = {
  // Get admin statistics
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },
};
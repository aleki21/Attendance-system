import api from './authService';

export interface UsherDashboardData {
  todayEvents: any[];
  totalMembers: number;
  assignedMembers: number;
}

export const usherService = {
  // Get usher dashboard data
  async getDashboard(): Promise<UsherDashboardData> {
    const response = await api.get<UsherDashboardData>('/usher/dashboard');
    return response.data;
  },
};
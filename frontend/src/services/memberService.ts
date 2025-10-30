import api from './authService';

export interface Member {
  memberId: number;
  name: string;
  ageGroup: 'child' | 'youth' | 'adult';
  gender: 'male' | 'female';
  residence: string;
  phone?: string;
  createdAt: string;
}

export interface CreateMemberData {
  name: string;
  ageGroup: 'child' | 'youth' | 'adult';
  gender: 'male' | 'female';
  residence: string;
  phone?: string;
}

export interface MembersResponse {
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MemberStats {
  totalMembers: number;
  ageDistribution: {
    group: string;
    count: number;
    percentage: number;
  }[];
}

export const memberService = {
  // Get all members with pagination and filters
  async getMembers(params?: {
    search?: string;
    ageGroup?: string;
    gender?: string;
    page?: number;
    limit?: number;
  }): Promise<MembersResponse> {
    const response = await api.get<MembersResponse>('/members', { params });
    return response.data;
  },

  // Get member statistics
  async getStats(): Promise<MemberStats> {
    const response = await api.get<MemberStats>('/members/stats');
    return response.data;
  },

  // Create new member
  async createMember(memberData: CreateMemberData): Promise<{ message: string; member: Member }> {
    const response = await api.post<{ message: string; member: Member }>('/members', memberData);
    return response.data;
  },

  // Update member
  async updateMember(memberId: number, memberData: CreateMemberData): Promise<{ message: string; member: Member }> {
    const response = await api.put<{ message: string; member: Member }>(`/members/${memberId}`, memberData);
    return response.data;
  },

  // Delete member
  async deleteMember(memberId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/members/${memberId}`);
    return response.data;
  },
};
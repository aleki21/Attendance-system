import api from './authService';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'admin' | 'usher';
  active: boolean;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'usher';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  active?: boolean;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const userService = {
  // Get all users
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const response = await api.get<UsersResponse>('/users', { params });
    return response.data;
  },

  // Get user by ID
  async getUser(userId: number): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>(`/users/${userId}`);
    return response.data;
  },

  // Create user
  async createUser(userData: CreateUserData): Promise<{ message: string; user: User }> {
    const response = await api.post<{ message: string; user: User }>('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(userId: number, userData: UpdateUserData): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>(`/users/${userId}`, userData);
    return response.data;
  },

  // Deactivate user
  async deactivateUser(userId: number): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/users/${userId}/deactivate`);
    return response.data;
  },

  // Reactivate user
  async reactivateUser(userId: number): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/users/${userId}/reactivate`);
    return response.data;
  },
};
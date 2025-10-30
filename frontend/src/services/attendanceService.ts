import api from './authService';

export interface AttendanceRecord {
  attendanceId: number;
  memberId: number;
  eventId: number;
  status: 'present' | 'absent';
  markedBy?: number;
  markedAt: string;
}

export interface MemberAttendance {
  attendance: AttendanceRecord;
  member: {
    memberId: number;
    name: string;
    ageGroup: string;
    gender: string;
    residence: string;
    idNo?: string;
    phone?: string;
    createdAt: string;
  };
}

export interface RecordAttendanceData {
  eventId: number;
  attendance: {
    memberId: number;
    status: 'present' | 'absent';
  }[];
}

export interface AttendanceStats {
  eventId: number;
  eventName: string;
  eventDate: string;
  present: number;
  total: number;
  percentage: number;
}

export interface TodayStats {
  eventId: number;
  eventName: string;
  totalMembers: number;
  presentCount: number;
}

export interface EventAttendanceResponse {
  attendance: MemberAttendance[];
}

export const attendanceService = {
  // Record attendance
  async recordAttendance(data: RecordAttendanceData): Promise<{ message: string; records: AttendanceRecord[] }> {
    const response = await api.post<{ message: string; records: AttendanceRecord[] }>('/attendance', data);
    return response.data;
  },

  // Get attendance for specific event
  async getEventAttendance(eventId: number): Promise<EventAttendanceResponse> {
    const response = await api.get<EventAttendanceResponse>(`/attendance/event/${eventId}`);
    return response.data;
  },

  // Get attendance statistics
  async getStats(params?: {
    eventId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ statistics: AttendanceStats[] }> {
    const response = await api.get<{ statistics: AttendanceStats[] }>('/attendance/stats', { params });
    return response.data;
  },

  // Get today's attendance overview
  async getTodayAttendance(): Promise<{ todayStats: TodayStats[] }> {
    const response = await api.get<{ todayStats: TodayStats[] }>('/attendance/today');
    return response.data;
  },

  exportEventReport: async (eventId: number, format: 'csv' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/attendance/events/${eventId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },
};
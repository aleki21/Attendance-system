import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, BarChart3, Shield, LogOut, 
  UserPlus, TrendingUp, Clock,
  Plus, Trash2, Edit, Eye, Download, Search,
  UserCheck, Activity,
  UserMinus, RefreshCw, LayoutDashboard, UserCog, CalendarDays
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../../src/contexts/AuthContext';
import { memberService, type Member, type MemberStats } from '../../../src/services/memberService';
import { userService, type User as SystemUser } from '../../../src/services/userService';
import { eventService, type Event } from '../../../src/services/eventService';
import { attendanceService, type TodayStats } from '../../../src/services/attendanceService';
import { adminService, type AdminStats } from '../../../src/services/adminService';
import { analyticsService, type AnalyticsData } from '../../../src/services/analyticsService';
import { convertDemographicsToPieData } from '../../../src/utils/chartUtils';
import { AddUsherModal, AddMemberModal, EditMemberModal, AddEventModal, EditEventModal, ViewAttendanceModal, AddAdminModal, ViewUserModal } from '../../../src/components/modals';
import EventCalendar from '../../../src/components/Calendar';

// Add this helper function for Kenya time
const getTodayInKenya = () => {
  const now = new Date();
  const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return kenyaTime.toISOString().split('T')[0];
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'ushers' | 'admins' | 'events' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Modals
  const [isAddUsherModalOpen, setIsAddUsherModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isViewAttendanceModalOpen, setIsViewAttendanceModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // State for data
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [, setMemberStats] = useState<MemberStats | null>(null);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [activeUshers, setActiveUshers] = useState<SystemUser[]>([]);
  const [deactivatedUshers, setDeactivatedUshers] = useState<SystemUser[]>([]);
  const [activeAdmins, setActiveAdmins] = useState<SystemUser[]>([]);
  const [deactivatedAdmins, setDeactivatedAdmins] = useState<SystemUser[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]); // NEW: Today's events
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [ushersTab, setUshersTab] = useState<'active' | 'deactivated'>('active');
  const [adminsTab, setAdminsTab] = useState<'active' | 'deactivated'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [exportLoading, setExportLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Chart colors
  const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    male: '#3b82f6',     // Blue for men
    female: '#ec4899',   // Pink for women
    background: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [retryCount]);

  // Load analytics data when tab changes or timeRange changes
  useEffect(() => {
    if (activeTab === 'reports') {
      loadAnalyticsData();
    }
  }, [activeTab, timeRange]);

  // Load calendar events when events tab is active
  useEffect(() => {
    if (activeTab === 'events') {
      loadCalendarEvents();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const [
        adminStatsData,
        memberStatsData,
        membersData,
        usersData,
        eventsData,
        todayAttendanceData,
        adminUsersData,
        todayEventsData // NEW: Load today's events
      ] = await Promise.all([
        adminService.getStats(),
        memberService.getStats(),
        memberService.getMembers({ page: 1, limit: 5 }),
        userService.getUsers({ role: 'usher', page: 1, limit: 50 }),
        eventService.getUpcomingEvents(),
        attendanceService.getTodayAttendance(),
        userService.getUsers({ role: 'admin', page: 1, limit: 50 }),
        eventService.getTodayEvents() // NEW: Fetch today's events
      ]);

      console.log('📊 Today stats:', todayAttendanceData.todayStats);
      console.log('📅 Today events:', todayEventsData.events);
      console.log('🇰🇪 Kenya today date:', getTodayInKenya());

      setAdminStats(adminStatsData);
      setMemberStats(memberStatsData);
      setRecentMembers(membersData.members);
      
      // Filter users by role
      const allUsers = usersData.users;
      setActiveUshers(allUsers.filter((user: SystemUser) => user.active && user.role === 'usher'));
      setDeactivatedUshers(allUsers.filter((user: SystemUser) => !user.active && user.role === 'usher'));
      
      // Filter admin users
      const allAdmins = adminUsersData.users;
      setActiveAdmins(allAdmins.filter((user: SystemUser) => user.active && user.role === 'admin'));
      setDeactivatedAdmins(allAdmins.filter((user: SystemUser) => !user.active && user.role === 'admin'));
      
      setUpcomingEvents(eventsData.events);
      setTodayStats(todayAttendanceData.todayStats);
      setTodayEvents(todayEventsData.events); // NEW: Set today's events

      // Load all members for the members tab
      const allMembersData = await memberService.getMembers({ page: 1, limit: 50 });
      setAllMembers(allMembersData.members);

    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      if (retryCount < 3) {
        setTimeout(() => setRetryCount(prev => prev + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await analyticsService.getAnalytics(timeRange);
      console.log('Analytics Data:', data); // Debug log
      console.log('Gender Trends:', data.genderAttendanceTrends); // Debug log
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      setCalendarLoading(true);
      // Load events for a wider range including past events
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // Load events from past year
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6); // And next 6 months
      
      const eventsData = await eventService.getEvents({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 200 // Increase limit to get more events
      });
      
      setAllEvents(eventsData.events);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Event Handlers
  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setIsEditMemberModalOpen(true);
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
        await memberService.deleteMember(memberId);
        await loadDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete member');
    }
  };


  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  };

  const handleViewAttendance = (event: Event) => {
    setSelectedEvent(event);
    setIsViewAttendanceModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        await eventService.deleteEvent(eventId);
        await loadDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleGenerateSundays = async () => {
    try {
      await eventService.generateSundayServices(12);
      await loadDashboardData();
      await loadCalendarEvents();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to generate Sunday services');
    }
  };

  const handleUsherCreated = () => {
    loadDashboardData();
  };

  const handleAdminCreated = () => {
    loadDashboardData();
  };

  const handleViewUser = (user: SystemUser) => {
    setSelectedUser(user);
    setIsViewUserModalOpen(true);
  };


  const handleDeactivateUser = async (userId: number) => {
    try {
      if (window.confirm('Are you sure you want to deactivate this user? They will no longer be able to access the system.')) {
        await userService.deactivateUser(userId);
        await loadDashboardData();
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleReactivateUser = async (userId: number) => {
    try {
      if (window.confirm('Are you sure you want to reactivate this user? They will be able to access the system again.')) {
        await userService.reactivateUser(userId);
        await loadDashboardData();
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to reactivate user');
    }
  };


  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      setExportLoading(true);
      const blob = await analyticsService.exportReport(format, timeRange);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `church-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredMembers = allMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.residence.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick stats for the stats grid
  const quickStats = [
    { 
      label: 'Total Members', 
      value: adminStats?.totalMembers?.toString() || '0', 
      icon: Users, 
      color: 'blue',
      change: '+12%',
      description: 'Total registered members',
      showChange: true
    },
    { 
      label: "Today's Events", 
      value: todayEvents.length.toString(), 
      icon: Calendar, 
      color: 'green',
      change: todayEvents.length > 0 ? 'Active' : 'None',
      description: 'Events scheduled today',
      showChange: false
    },
    { 
      label: 'Active Ushers', 
      value: activeUshers.length.toString(),
      icon: UserCog, 
      color: 'orange',
      change: '+1',
      description: 'System users',
      showChange: false
    },
    { 
      label: "Today's Attendance", 
      value: todayStats.length > 0 && todayStats[0].totalMembers
        ? `${todayStats[0].presentCount || 0}/${todayStats[0].totalMembers}`
        : '0/0', 
      icon: UserCheck, 
      color: 'purple',
      change: todayStats.length > 0 && todayStats[0].totalMembers
        ? `${Math.round(((todayStats[0].presentCount || 0) / todayStats[0].totalMembers) * 100)}%`
        : '0%',
      description: 'Kenya time attendance',
      showChange: true
    },
  ];

  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'ushers', label: 'Ushers', icon: UserCog },
    { id: 'admins', label: 'Admins', icon: Shield },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Dashboard</p>
          <p className="text-gray-400 text-sm mt-2">
            {retryCount > 0 ? `Attempt ${retryCount} of 3` : 'Preparing your data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Unavailable</h2>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={loadDashboardData}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retry Loading Dashboard
            </button>
            
            <button
              onClick={logout}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Church Analytics
                </h1>
                <p className="text-gray-500 text-sm">
                  Complete system administration panel
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 pb-2">
            {navigation.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white text-gray-700 hover:text-blue-600 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                      <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  {stat.showChange && (
                    <div className="flex items-center mt-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-100 text-${stat.color}-800`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">from last week</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Today's Overview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Today's Overview</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 🇰🇪
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Today's Event Card - UPDATED */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <Calendar className="h-8 w-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-blue-800">Today's Event</h4>
                    {todayEvents.length > 0 ? (
                      <div>
                        <p className="text-blue-600 mt-2 font-medium">
                          {todayEvents[0].name}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            todayEvents[0].eventType === 'sunday_service' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {todayEvents[0].eventType === 'sunday_service' ? 'Sunday Service' : 'Custom Event'}
                          </span>
                          {todayEvents[0].autoGenerated && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-500 mt-2">
                          {todayEvents.length > 1 ? `+${todayEvents.length - 1} more events` : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-blue-600 mt-2 font-medium">
                          No events today
                        </p>
                        <p className="text-xs text-blue-500 mt-2">
                          Create an event to get started
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attendance Progress Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <UserCheck className="h-8 w-8 text-green-600 mb-3" />
                    <h4 className="font-semibold text-green-800">Attendance Progress</h4>
                    <p className="text-green-600 mt-2 font-medium">
                      {todayStats.length > 0 && todayStats[0].totalMembers
                        ? `${todayStats[0].presentCount || 0}/${todayStats[0].totalMembers} members (${Math.round(((todayStats[0].presentCount || 0) / todayStats[0].totalMembers) * 100)}%)`
                        : 'No attendance data'
                      }
                    </p>
                    {todayStats.length > 0 && todayStats[0].eventName && (
                      <p className="text-xs text-green-500 mt-2">
                        For: {todayStats[0].eventName}
                      </p>
                    )}
                  </div>

                  {/* Active Ushers Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <Shield className="h-8 w-8 text-orange-600 mb-3" />
                    <h4 className="font-semibold text-orange-800">Active Ushers</h4>
                    <p className="text-orange-600 mt-2 font-medium">{activeUshers.length} ushers online</p>
                    <p className="text-xs text-orange-500 mt-2">
                      Ready for attendance tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentMembers.map((member) => (
                      <div key={member.memberId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                            <p className="text-xs text-gray-500 capitalize">
                              {member.ageGroup} • {member.gender}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <div key={event.eventId} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <Calendar className="h-8 w-8 text-blue-600 mr-4" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString()} • {event.eventType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Management Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Member Management</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage all church members and their information</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 bg-white"
                      />
                    </div>
                    <button 
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/25 whitespace-nowrap"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age Group</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.memberId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-3">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                                <div className="text-xs text-gray-500 truncate">{member.residence}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              member.ageGroup === 'child' 
                                ? 'bg-purple-100 text-purple-800'
                                : member.ageGroup === 'youth'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {member.ageGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 truncate">{member.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditMember(member)}
                                className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                                title="Edit member"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteMember(member.memberId)}
                                className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                                title="Delete member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first member to the system.</p>
                    <button 
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center mx-auto font-medium shadow-lg shadow-blue-500/25"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Member
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usher Management Tab */}
        {activeTab === 'ushers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Usher Management</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage system ushers and their access</p>
                  </div>
                  <button 
                    onClick={() => setIsAddUsherModalOpen(true)}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/25 whitespace-nowrap w-full sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Usher
                  </button>
                </div>
                
                {/* Ushers Tabs */}
                <div className="mt-4 flex space-x-1">
                  <button
                    onClick={() => setUshersTab('active')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      ushersTab === 'active'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white text-gray-700 hover:text-blue-600 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Active Ushers ({activeUshers.length})
                  </button>
                  <button
                    onClick={() => setUshersTab('deactivated')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      ushersTab === 'deactivated'
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-700 hover:text-gray-800 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Deactivated Ushers ({deactivatedUshers.length})
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {ushersTab === 'active' && (
                  activeUshers.length === 0 ? (
                    <div className="text-center py-12">
                      <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Ushers</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first usher to the system.</p>
                      <button 
                        onClick={() => setIsAddUsherModalOpen(true)}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center mx-auto font-medium shadow-lg shadow-blue-500/25"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Your First Usher
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeUshers.map((usher) => (
                        <div key={usher.userId} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {usher.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{usher.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{usher.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex-shrink-0">Active</span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">Joined: {new Date(usher.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewUser(usher)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleDeactivateUser(usher.userId)}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors font-medium"
                            >
                              Deactivate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {ushersTab === 'deactivated' && (
                  deactivatedUshers.length === 0 ? (
                    <div className="text-center py-12">
                      <UserMinus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Deactivated Ushers</h3>
                      <p className="text-gray-500">All ushers are currently active.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deactivatedUshers.map((usher) => (
                        <div key={usher.userId} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {usher.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-600 truncate">{usher.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{usher.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">Deactivated</span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">Joined: {new Date(usher.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewUser(usher)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleReactivateUser(usher.userId)}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-green-700 transition-colors font-medium"
                            >
                              Reactivate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Admin Management</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage system administrators</p>
                  </div>
                  <button 
                    onClick={() => setIsAddAdminModalOpen(true)}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-purple-500/25 whitespace-nowrap w-full sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Admin
                  </button>
                </div>
                
                {/* Admins Tabs */}
                <div className="mt-4 flex space-x-1">
                  <button
                    onClick={() => setAdminsTab('active')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      adminsTab === 'active'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white text-gray-700 hover:text-purple-600 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Active Admins ({activeAdmins.length})
                  </button>
                  <button
                    onClick={() => setAdminsTab('deactivated')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      adminsTab === 'deactivated'
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-700 hover:text-gray-800 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Deactivated Admins ({deactivatedAdmins.length})
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {adminsTab === 'active' && (
                  activeAdmins.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Admins</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first admin to the system.</p>
                      <button 
                        onClick={() => setIsAddAdminModalOpen(true)}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center mx-auto font-medium shadow-lg shadow-purple-500/25"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Your First Admin
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeAdmins.map((admin) => (
                        <div key={admin.userId} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{admin.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex-shrink-0">Active</span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>Role: Administrator</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>Joined: {new Date(admin.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewUser(admin)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleDeactivateUser(admin.userId)}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors font-medium"
                            >
                              Deactivate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {adminsTab === 'deactivated' && (
                  deactivatedAdmins.length === 0 ? (
                    <div className="text-center py-12">
                      <UserMinus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Deactivated Admins</h3>
                      <p className="text-gray-500">All admin accounts are currently active.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deactivatedAdmins.map((admin) => (
                        <div key={admin.userId} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-600 truncate">{admin.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">Deactivated</span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>Role: Administrator</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>Joined: {new Date(admin.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewUser(admin)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleReactivateUser(admin.userId)}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-green-700 transition-colors font-medium"
                            >
                              Reactivate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Events Management Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Event Management Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
                    <p className="text-gray-500 text-sm mt-1">Manage church events and schedules</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleGenerateSundays}
                      className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-purple-500/25 whitespace-nowrap"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Generate Sundays
                    </button>
                    <button 
                      onClick={() => setIsAddEventModalOpen(true)}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/25 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div key={event.eventId} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200 bg-white gap-4">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <Calendar className="h-10 w-10 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">{event.name}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                event.eventType === 'sunday_service' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {event.eventType === 'sunday_service' ? 'Sunday Service' : 'Custom Event'}
                              </span>
                              {event.autoGenerated && (
                                <span className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-medium">
                                  Auto-generated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 lg:justify-end">
                          <button 
                            onClick={() => handleViewAttendance(event)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center font-medium whitespace-nowrap"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Attendance
                          </button>
                          <button 
                            onClick={() => handleEditEvent(event)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center font-medium whitespace-nowrap"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(event.eventId)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-medium whitespace-nowrap"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                      <p className="text-gray-500 mb-4">Create your first event or generate Sunday services to get started.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                          onClick={handleGenerateSundays}
                          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-purple-500/25"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Generate Sundays
                        </button>
                        <button 
                          onClick={() => setIsAddEventModalOpen(true)}
                          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/25"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Event
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Event Calendar</h3>
                <p className="text-gray-500 text-sm mt-1">
                  View all events in calendar format. Click on events to view details and export attendance.
                </p>
              </div>
              <div className="p-6">
                {calendarLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading calendar events...</p>
                  </div>
                ) : (
                  <EventCalendar events={allEvents} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Header with Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-gray-600 mt-1">
                    Comprehensive insights into church attendance and member engagement
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white w-full sm:w-auto"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last Year</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportReport('csv')}
                      disabled={exportLoading || analyticsLoading}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExportReport('pdf')}
                      disabled={exportLoading || analyticsLoading}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading analytics data...</p>
              </div>
            ) : !analyticsData ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-500">Analytics data will appear here once available.</p>
              </div>
            ) : (
              <>
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {analyticsData.topMetrics.averageAttendance}%
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-100">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Overall engagement rate</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Peak Attendance</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {analyticsData.topMetrics.peakAttendance}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-green-100">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Highest recorded</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Member Growth</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          +{analyticsData.topMetrics.memberGrowth}%
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-100">
                        <UserPlus className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Since last period</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {analyticsData.topMetrics.engagementRate}%
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-100">
                        <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Active participation</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Overall Attendance Trends Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Total Attendance Trends</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Combined attendance across all age groups (Adults, Youth, and Children)
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={analyticsData.attendanceTrends}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return timeRange === 'year' 
                                ? date.toLocaleDateString('en-US', { month: 'short' })
                                : timeRange === 'quarter'
                                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'attendance') return [`${value} attendees`, 'Attendance'];
                              if (name === 'percentage') return [`${value}%`, 'Rate'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="attendance" 
                            stroke={CHART_COLORS.primary} 
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                            name="Attendance Count"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Adult Gender Attendance Progress Chart - FIXED: Consistent property names */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Adult Attendance by Gender</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        Adults Only
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Tracking attendance patterns for adult male and female members (excludes youth and children)
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={analyticsData.genderAttendanceTrends}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return timeRange === 'year' 
                                ? date.toLocaleDateString('en-US', { month: 'short' })
                                : timeRange === 'quarter'
                                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'male') return [`${value} adults`, 'Adult Men'];
                              if (name === 'female') return [`${value} adults`, 'Adult Women'];
                              if (name === 'total') return [`${value} adults`, 'Total Adults'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="male" 
                            stroke={CHART_COLORS.male}
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.male, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: CHART_COLORS.male }}
                            name="Adult Men"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="female" 
                            stroke={CHART_COLORS.female}
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.female, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: CHART_COLORS.female }}
                            name="Adult Women"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      <p>• Shows attendance for adult members only (excludes children and youth)</p>
                      <p>• Typically represents 60-80% of total attendance</p>
                    </div>
                  </div>

                  {/* Demographics Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Member Demographics</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={convertDemographicsToPieData(analyticsData.demographics)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {convertDemographicsToPieData(analyticsData.demographics).map((_entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CHART_COLORS.background[index % CHART_COLORS.background.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => {
                              const payload = props.payload;
                              return [
                                `${value} members (${payload.percentage}%)`,
                                payload.ageGroup || name
                              ];
                            }}
                          />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Event Performance */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Performance</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={analyticsData.eventAttendance.slice(0, 6)} 
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                          <XAxis 
                            type="number" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="eventName" 
                            tick={{ fontSize: 12 }}
                            width={120}
                            tickFormatter={(value) => {
                              if (value.length > 20) return value.substring(0, 20) + '...';
                              return value;
                            }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value} attendees`, 'Count']}
                            labelFormatter={(label, props) => {
                              const event = props[0]?.payload;
                              return event ? `${event.eventName} (${new Date(event.date).toLocaleDateString()})` : label;
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="attendance" 
                            fill={CHART_COLORS.secondary}
                            name="Attendance"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Insights Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-blue-800">Adult Engagement</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Adult attendance shows consistent patterns with {analyticsData.genderAttendanceTrends?.[0] ? 
                        Math.round((analyticsData.genderAttendanceTrends[0].male + analyticsData.genderAttendanceTrends[0].female) / analyticsData.attendanceTrends[0]?.attendance * 100) : 70}% 
                        of total attendance.
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-semibold text-green-800">Gender Balance</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Adult women typically represent 55-60% of adult attendance, showing higher engagement rates.
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-semibold text-purple-800">Weekly Patterns</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        Sunday services show highest adult engagement with consistent gender participation.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddUsherModal
        isOpen={isAddUsherModalOpen}
        onClose={() => setIsAddUsherModalOpen(false)}
        onSuccess={handleUsherCreated}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <EditMemberModal
        isOpen={isEditMemberModalOpen}
        onClose={() => {
          setIsEditMemberModalOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={loadDashboardData}
        member={selectedMember}
      />

      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => {
          setIsEditEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSuccess={loadDashboardData}
        event={selectedEvent}
      />

      <ViewAttendanceModal
        isOpen={isViewAttendanceModalOpen}
        onClose={() => {
          setIsViewAttendanceModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      <AddAdminModal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        onSuccess={handleAdminCreated}
      />

      <ViewUserModal
        isOpen={isViewUserModalOpen}
        onClose={() => {
          setIsViewUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminDashboard;
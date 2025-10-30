import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Calendar, Users, CheckCircle, X, LogOut, Clock, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, type Event } from '../../services/eventService';
import { memberService, type Member } from '../../services/memberService';
import { attendanceService, type MemberAttendance } from '../../services/attendanceService';
import { AddMemberModal } from '../../components/modals';

const UsherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [eventsResponse, membersResponse] = await Promise.all([
        eventService.getTodayEvents(),
        memberService.getMembers({ page: 1, limit: 1000 })
      ]);

      setTodayEvents(eventsResponse.events);
      setAllMembers(membersResponse.members);

      if (selectedEvent) {
        await loadEventAttendance(selectedEvent.eventId);
      }

    } catch (error) {
      console.error('Failed to load usher dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventAttendance = async (eventId: number) => {
    try {
      const attendanceResponse = await attendanceService.getEventAttendance(eventId);
      const presentMemberIds = new Set(
        attendanceResponse.attendance
          .filter((record: MemberAttendance) => record.attendance.status === 'present')
          .map((record: MemberAttendance) => record.member.memberId)
      );
      setAttendanceMarked(presentMemberIds);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    }
  };

  const handleMarkAttendance = async (memberId: number) => {
    if (!selectedEvent) return;

    try {
      setMarkingAttendance(memberId);
      
      await attendanceService.recordAttendance({
        eventId: selectedEvent.eventId,
        attendance: [
          {
            memberId: memberId,
            status: 'present' as const
          }
        ]
      });

      setAttendanceMarked(prev => new Set(prev).add(memberId));
      setSuccessMessage('Attendance marked successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(null);
    }
  };


  const handleMemberCreated = () => {
    loadDashboardData(); // Refresh the members list
    setSuccessMessage('Member added successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.residence.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPresent = attendanceMarked.has(member.memberId);
    
    if (filter === 'present') return matchesSearch && isPresent;
    if (filter === 'absent') return matchesSearch && !isPresent;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading Dashboard</p>
          <p className="text-gray-500 text-sm mt-2">Preparing your events...</p>
        </div>
      </div>
    );
  }

  // If no event selected, show event selection
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Usher Portal
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Welcome back, {user?.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Usher</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
          </div>
        </header>

        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Today's Events
            </h2>
            <p className="text-gray-600 text-lg">
              Select an event to start marking attendance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayEvents.map(event => (
              <div
                key={event.eventId}
                onClick={async () => {
                  setSelectedEvent(event);
                  await loadEventAttendance(event.eventId);
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    event.eventType === 'sunday_service' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.eventType === 'sunday_service' ? 'Sunday Service' : 'Custom Event'}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {event.name}
                </h3>
                
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white py-2 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg shadow-green-500/25">
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>

          {todayEvents.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events Today</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                There are no events scheduled for today. Check back later or contact your administrator.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show attendance marking interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Back to events"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <UserCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Marking Attendance
                </h1>
                <p className="text-gray-500 text-sm">
                  {selectedEvent.name} • Welcome, {user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {attendanceMarked.size} / {allMembers.length} Present
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round((attendanceMarked.size / allMembers.length) * 100)}% Complete
                </p>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Event Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.name}</h2>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedEvent.eventType === 'sunday_service' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedEvent.eventType === 'sunday_service' ? 'Sunday Service' : 'Custom Event'}
                    </span>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                      {attendanceMarked.size} Present
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round((attendanceMarked.size / allMembers.length) * 100)}%
                  </div>
                  <p className="text-gray-500 text-sm">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search members by name, residence, or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              <div className="flex space-x-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('present')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      filter === 'present' 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => setFilter('absent')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      filter === 'absent' 
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Absent
                  </button>
                </div>
                <button 
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center font-medium shadow-lg shadow-blue-500/25"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members ({filteredMembers.length})
                <span className="ml-2 text-sm font-normal text-gray-500">
                  • Filtered by {filter}
                </span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age Group</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map(member => {
                      const isMarked = attendanceMarked.has(member.memberId);
                      const isMarking = markingAttendance === member.memberId;
                      
                      return (
                        <tr key={member.memberId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.residence}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
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
                            <div className="text-sm text-gray-900">{member.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isMarked ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!isMarked ? (
                              <button
                                onClick={() => handleMarkAttendance(member.memberId)}
                                disabled={isMarking}
                                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center font-medium shadow-lg shadow-green-500/25"
                              >
                                {isMarking ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Marking...
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Mark Present
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-green-600 font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Recorded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search terms or add a new member</p>
                    <button 
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center mx-auto font-medium shadow-lg shadow-blue-500/25"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Member
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-800 mb-3 text-lg">How to mark attendance:</h4>
            <ul className="text-blue-700 space-y-2">
              <li className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 text-sm font-bold">1</span>
                </div>
                Search for members by name, residence, or ID number
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 text-sm font-bold">2</span>
                </div>
                Click "Mark Present" for each member who attended
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 text-sm font-bold">3</span>
                </div>
                Use filters to view present/absent members
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 text-sm font-bold">4</span>
                </div>
                Add new members if someone is missing from the list
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 text-sm font-bold">5</span>
                </div>
                Members not marked will automatically be recorded as absent
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={handleMemberCreated}
      />
    </div>
  );
};

export default UsherDashboard;
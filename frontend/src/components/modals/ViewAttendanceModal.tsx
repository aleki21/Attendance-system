import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, UserX, Download, Search, Edit, Save, Loader } from 'lucide-react';
import { type Event } from '../../services/eventService';
import { attendanceService, type MemberAttendance, type RecordAttendanceData } from '../../services/attendanceService';
import { memberService, type Member } from '../../services/memberService';

interface ViewAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

interface AttendanceStats {
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

interface EditState {
  memberId: number;
  currentStatus: 'present' | 'absent';
  newStatus: 'present' | 'absent';
}

const ViewAttendanceModal: React.FC<ViewAttendanceModalProps> = ({ isOpen, onClose, event }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<MemberAttendance[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      loadAttendanceData();
    }
  }, [isOpen, event]);

  const loadAttendanceData = async () => {
    if (!event) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Load attendance records for this event
      const attendanceResponse = await attendanceService.getEventAttendance(event.eventId);
      const attendanceData = attendanceResponse.attendance || [];
      setAttendanceRecords(attendanceData);

      // Load all members to calculate absent members
      const membersResponse = await memberService.getMembers({ page: 1, limit: 1000 });
      const allMembersData = membersResponse.members;
      setAllMembers(allMembersData);

      // Calculate statistics
      const presentCount = attendanceData.filter(record => record.attendance.status === 'present').length;
      const totalMembers = allMembersData.length;
      const absentCount = totalMembers - presentCount;
      const attendancePercentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

      setAttendanceStats({
        totalMembers,
        presentCount,
        absentCount,
        attendancePercentage
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAttendanceRecords([]);
    setAllMembers([]);
    setAttendanceStats(null);
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setSearchTerm('');
    setEditing(null);
    setSaving(null);
    onClose();
  };

  const startEditing = (memberId: number, currentStatus: 'present' | 'absent') => {
    setEditing({
      memberId,
      currentStatus,
      newStatus: currentStatus === 'present' ? 'absent' : 'present'
    });
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const saveAttendance = async (memberId: number, newStatus: 'present' | 'absent') => {
    if (!event) return;

    try {
      setSaving(memberId);
      setError(null);

      const recordAttendanceData: RecordAttendanceData = {
        eventId: event.eventId,
        attendance: [
          {
            memberId: memberId,
            status: newStatus
          }
        ]
      };

      await attendanceService.recordAttendance(recordAttendanceData);
      
      setSuccessMessage(`Attendance updated successfully for member ID: ${memberId}`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh the data to show updated status
      await loadAttendanceData();
      setEditing(null);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSaving(null);
    }
  };

  const handleExportAttendance = () => {
    // Generate CSV content
    const headers = ['Name', 'Age Group', 'Gender', 'Residence', 'ID Number', 'Status', 'Marked At'];
    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        `"${record.member.name}"`,
        record.member.ageGroup,
        record.member.gender,
        `"${record.member.residence}"`,
        record.member.idNo || 'N/A',
        record.attendance.status,
        new Date(record.attendance.markedAt).toLocaleString()
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${event?.name}-${event?.date}.csv`.replace(/[^a-zA-Z0-9-_]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter members based on search
  const filteredRecords = attendanceRecords.filter(record =>
    record.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.member.residence.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.member.idNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentRecords = filteredRecords.filter(record => record.attendance.status === 'present');
  const absentRecords = allMembers.filter(member => 
    !attendanceRecords.some(record => 
      record.member.memberId === member.memberId && record.attendance.status === 'present'
    )
  ).filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.residence.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Attendance for {event.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading attendance data...</p>
            </div>
          ) : attendanceStats ? (
            <div className="space-y-6">
              {/* Admin Controls */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Admin Controls
                </h3>
                <p className="text-sm text-blue-700">
                  Click the edit button next to any member to change their attendance status between Present and Absent.
                </p>
              </div>

              {/* Attendance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{attendanceStats.presentCount}</div>
                  <div className="text-sm text-green-700">Present</div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <UserX className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-900">{attendanceStats.absentCount}</div>
                  <div className="text-sm text-red-700">Absent</div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{attendanceStats.attendancePercentage}%</div>
                  <div className="text-sm text-blue-700">Attendance Rate</div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{attendanceStats.totalMembers}</div>
                  <div className="text-sm text-gray-700">Total Members</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Attendance Progress</span>
                  <span>{attendanceStats.presentCount}/{attendanceStats.totalMembers} members</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${attendanceStats.attendancePercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search members by name, residence, or ID number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Attendance Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Present Members */}
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Present Members ({presentRecords.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {presentRecords.length > 0 ? (
                      presentRecords.map(record => {
                        const isEditing = editing?.memberId === record.member.memberId;
                        const isSaving = saving === record.member.memberId;

                        return (
                          <div key={record.attendance.attendanceId} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-green-900">{record.member.name}</p>
                                <p className="text-sm text-green-700 capitalize">
                                  {record.member.ageGroup} • {record.member.gender} • {record.member.residence}
                                </p>
                                {record.member.idNo && (
                                  <p className="text-xs text-green-600 font-mono">ID: {record.member.idNo}</p>
                                )}
                                <p className="text-xs text-green-600">
                                  Marked at: {new Date(record.attendance.markedAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0 ml-2">
                                {isEditing ? (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => saveAttendance(record.member.memberId, 'absent')}
                                      disabled={isSaving}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                                    >
                                      {isSaving ? (
                                        <Loader className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <Save className="h-3 w-3 mr-1" />
                                      )}
                                      Mark Absent
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-gray-600 hover:text-gray-800 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                                      Present
                                    </span>
                                    <button
                                      onClick={() => startEditing(record.member.memberId, 'present')}
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Edit attendance"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No members marked present</p>
                    )}
                  </div>
                </div>

                {/* Absent Members */}
                <div>
                  <h3 className="text-lg font-medium text-red-700 mb-3 flex items-center">
                    <UserX className="h-5 w-5 mr-2" />
                    Absent Members ({absentRecords.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {absentRecords.length > 0 ? (
                      absentRecords.map(member => {
                        const isEditing = editing?.memberId === member.memberId;
                        const isSaving = saving === member.memberId;

                        return (
                          <div key={member.memberId} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-red-900">{member.name}</p>
                                <p className="text-sm text-red-700 capitalize">
                                  {member.ageGroup} • {member.gender} • {member.residence}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0 ml-2">
                                {isEditing ? (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => saveAttendance(member.memberId, 'present')}
                                      disabled={isSaving}
                                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                                    >
                                      {isSaving ? (
                                        <Loader className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <Save className="h-3 w-3 mr-1" />
                                      )}
                                      Mark Present
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-gray-600 hover:text-gray-800 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
                                      Absent
                                    </span>
                                    <button
                                      onClick={() => startEditing(member.memberId, 'absent')}
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Edit attendance"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">All members are present!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-center pt-4 border-t border-gray-200">
                <button
                  onClick={handleExportAttendance}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Attendance Report (CSV)
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ViewAttendanceModal;
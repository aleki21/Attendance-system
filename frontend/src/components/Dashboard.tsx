import React from 'react';
import { LogOut, User, Shield, Users, Calendar, Settings, BarChart3, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Stats data based on user role
  const getStats = () => {
    if (user?.role === 'admin') {
      return [
        { label: 'Total Events', value: '12', color: 'blue' },
        { label: 'Active Ushers', value: '8', color: 'green' },
        { label: 'Pending Tasks', value: '3', color: 'orange' },
        { label: 'Completed Events', value: '24', color: 'purple' },
      ];
    } else {
      return [
        { label: 'Assigned Events', value: '5', color: 'blue' },
        { label: 'Completed Shifts', value: '12', color: 'green' },
        { label: 'Upcoming Events', value: '2', color: 'orange' },
        { label: 'Hours This Month', value: '36', color: 'purple' },
      ];
    }
  };

  const getQuickActions = () => {
    if (user?.role === 'admin') {
      return [
        { icon: Users, label: 'Manage Users', description: 'Add or manage usher accounts', color: 'blue' },
        { icon: Calendar, label: 'Create Event', description: 'Schedule new events', color: 'green' },
        { icon: BarChart3, label: 'View Reports', description: 'Event analytics and insights', color: 'purple' },
        { icon: Settings, label: 'System Settings', description: 'Configure application settings', color: 'gray' },
      ];
    } else {
      return [
        { icon: Calendar, label: 'View Schedule', description: 'Check your upcoming events', color: 'blue' },
        { icon: CheckCircle, label: 'Check In', description: 'Check into your assigned event', color: 'green' },
        { icon: User, label: 'My Profile', description: 'Update your information', color: 'purple' },
        { icon: BarChart3, label: 'My Stats', description: 'View your performance metrics', color: 'orange' },
      ];
    }
  };

  const stats = getStats();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${user?.role === 'admin' ? 'bg-green-100' : 'bg-blue-100'}`}>
                {user?.role === 'admin' ? (
                  <Shield className="h-6 w-6 text-green-600" />
                ) : (
                  <Users className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Event Management System
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {user?.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md bg-${stat.color}-100 flex items-center justify-center`}>
                        <BarChart3 className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                        <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="lg:col-span-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${user?.role === 'admin' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {user?.role === 'admin' ? (
                      <Shield className="h-6 w-6 text-green-600" />
                    ) : (
                      <Users className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Welcome to your dashboard!
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user?.role === 'admin' 
                        ? 'You have full administrative access to the system.'
                        : 'You can manage your event assignments and check-in guests.'
                      }
                    </p>
                  </div>
                </div>

                {/* Role-specific content */}
                {user?.role === 'admin' && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-green-800">
                          Administrator Privileges
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          You can manage users, create events, view analytics, and configure system settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {user?.role === 'usher' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-blue-800">
                          Usher Account
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Need admin access? Contact your system administrator to upgrade your account privileges.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity Placeholder */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span>You successfully logged in to the system</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span>Welcome to the Event Management System</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={index}
                        className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className={`p-2 rounded-md bg-${action.color}-100`}>
                          <IconComponent className={`h-4 w-4 text-${action.color}-600`} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{action.label}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* System Status */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">API Connection</span>
                      <span className="text-green-600 font-medium">Connected</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Sync</span>
                      <span className="text-gray-600">Just now</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">User Since</span>
                      <span className="text-gray-600">Today</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
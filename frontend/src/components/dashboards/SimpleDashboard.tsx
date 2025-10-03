import React from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const SimpleDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Welcome, {user?.name}!
        </h1>
        <div className="text-center mb-6">
          <p className="text-gray-600">Role: <span className="font-semibold capitalize">{user?.role}</span></p>
          <p className="text-gray-600">Email: {user?.email}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-700 text-sm">
            The full dashboard is loading... If you see this for more than a few seconds, 
            there might be an issue with the API endpoints.
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SimpleDashboard;
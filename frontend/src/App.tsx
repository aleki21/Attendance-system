import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminDashboard from './components/dashboards/AdminDashboard';
import UsherDashboard from './components/dashboards/UsherDashboard';
import { Loader } from 'lucide-react';

type AuthMode = 'login' | 'register';

const AuthContent: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return mode === 'login' ? (
    <LoginForm onSwitchToRegister={() => setMode('register')} />
  ) : (
    <RegisterForm onSwitchToLogin={() => setMode('login')} />
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthContent />;
  }

  // Route to appropriate dashboard based on role
  return user.role === 'admin' ? <AdminDashboard /> : <UsherDashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
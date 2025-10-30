import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminDashboard from './components/dashboards/AdminDashboard';
import UsherDashboard from './components/dashboards/UsherDashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { Loader, Smartphone } from 'lucide-react'; // Added Smartphone import

type AuthMode = 'login' | 'register';

const AuthContent: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  return (
    <>
      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}
      
      {/* iOS Install Hint */}
      {isIOS && !localStorage.getItem('hasSeenIOSInstructions') && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 z-40">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700 flex-1">
              <span className="font-medium">Tip:</span> Add to home screen for quick access! 
              Tap Share → Add to Home Screen
            </p>
            <button
              onClick={() => localStorage.setItem('hasSeenIOSInstructions', 'true')}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthContent />;
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UsherDashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <PWAInstallPrompt />
    </AuthProvider>
  );
};

export default App;
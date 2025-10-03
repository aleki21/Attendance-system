import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RegisterForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // All new registrations will be 'usher' by default
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'usher' as const // Hardcoded to usher
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const hasPassword = formData.password.length > 0;
  const hasConfirmPassword = formData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            All new accounts are created as <span className="font-semibold text-blue-600">Ushers</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <label htmlFor="name" className="sr-only">Full Name</label>
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <label htmlFor="email" className="sr-only">Email address</label>
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className={`appearance-none rounded-md relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  hasConfirmPassword 
                    ? passwordsMatch 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password match indicator */}
            {hasConfirmPassword && (
              <div className={`text-xs flex items-center ${
                passwordsMatch ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordsMatch ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Passwords match
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Passwords do not match
                  </>
                )}
              </div>
            )}

            {/* Password strength indicator */}
            {hasPassword && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Password strength:</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      formData.password.length >= 8 ? 'bg-green-500' : 
                      formData.password.length >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((formData.password.length / 8) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {formData.password.length >= 8 ? 'Strong' : 
                   formData.password.length >= 6 ? 'Medium' : 'Weak'}
                </div>
              </div>
            )}

            {/* Role info box */}
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800 font-medium">Usher Account</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                All new registrations are created as Ushers. Admin access must be granted by an existing administrator.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading || (hasConfirmPassword && !passwordsMatch)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                'Create Usher Account'
              )}
            </button>

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useI18n } from '../hooks/useI18n';

const ToothIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10.5" />
    </svg>
);

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check user credentials against user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username);

      if (error || !data || data.length === 0) {
        throw new Error('Invalid username or password');
      }

      const userData = data[0];

      // For internal system, we'll accept any password for now
      // In production, implement proper password hashing and verification
      // For demo purposes, we accept any non-empty password

      if (!password || password.length < 1) {
        throw new Error('Password is required');
      }

      // Basic password verification - in production, use proper hashing
      // For now, we'll check if password matches the default admin password or any password for demo
      const isValidPassword = password === '123' || password.length >= 3; // Allow any password >= 3 chars for demo

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Store user session with login timestamp
      sessionStorage.setItem('clinic_user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        permissions: userData.permissions,
        loginTime: new Date().toISOString(),
      }));

      // Clear any previous login errors and reload to trigger auth state change
      setError(null);
      window.location.reload();

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center">
            <ToothIcon />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">CuraSoft Clinic</h1>
            <p className="text-slate-500">Login to access your clinic management system</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
           {error && (
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                   <span className="block sm:inline">{error}</span>
               </div>
           )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:bg-primary/50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

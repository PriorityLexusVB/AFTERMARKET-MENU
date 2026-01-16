import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { SetupGuide } from './SetupGuide';

interface LoginProps {
  isAuthLoading: boolean;
  firebaseError: string | null;
}

export const Login: React.FC<LoginProps> = ({ isAuthLoading, firebaseError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase authentication is not available.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.tsx will handle the view change
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      
      // Handle specific Firebase auth error codes
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later or reset your password.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection and try again.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password sign-in is not enabled. Please contact support.');
          break;
        default:
          setError(`Login failed: ${error.message || 'An unexpected error occurred. Please try again later.'}`);
      }
      
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    if (firebaseError) {
      return <SetupGuide error={firebaseError} />;
    }
    
    return (
       <>
        {isAuthLoading && (
            <div className="text-center text-gray-400 text-sm mb-6 p-3 bg-gray-900/50 rounded-md animate-pulse">
                <p>Checking session...</p>
            </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthLoading}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthLoading}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isAuthLoading || isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-widest font-teko text-white">PRIORITY <span className="text-gray-400">LEXUS</span></h1>
            <p className="text-xl text-gray-400 font-teko tracking-wider">{firebaseError ? "System Configuration" : "Admin Panel"}</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
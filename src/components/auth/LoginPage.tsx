import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, Mail } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { loginWithApi, persistAuthSession } from '../../api/authClient';
import type { StaffUser } from '../../types';

interface LoginPageProps {
  onSuccess: (user: StaffUser) => void;
  onGoRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginWithApi(email, password);
      persistAuthSession(result.token, result.user);
      onSuccess(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your work email and password to open the operations desk."
    >
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="login-email" className="auth-label">
            Email address
          </label>
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon h-4 w-4" aria-hidden />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username email"
              placeholder="you@shaktitravels.in"
              className="auth-input auth-input-with-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrap">
            <LockKeyhole className="auth-input-icon h-4 w-4" aria-hidden />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your account password"
              className="auth-input auth-input-with-icon pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-accent auth-submit w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign in to dashboard
            </>
          )}
        </button>

        <div className="auth-trust-row">
          <span>Encrypted session</span>
          <span className="auth-trust-dot" aria-hidden />
          <span>Role-based access</span>
        </div>

        <p className="auth-footer-text text-center">
          New team member?{' '}
          <button type="button" onClick={onGoRegister} className="auth-link font-semibold">
            Register your account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

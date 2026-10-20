import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { persistAuthSession, registerWithApi } from '../../api/authClient';
import type { StaffUser } from '../../types';

interface RegisterPageProps {
  onSuccess: (user: StaffUser) => void;
  onGoLogin: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onGoLogin }) => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithApi({
        name,
        email,
        password,
        mobile: mobile.trim() || undefined,
        designation: designation.trim() || undefined,
      });
      persistAuthSession(result.token, result.user);
      onSuccess(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join the team"
      subtitle="Register with your work email and password. The first account is admin; others receive access until roles are assigned."
    >
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="reg-name" className="auth-label">
            Full name
          </label>
          <div className="auth-input-wrap">
            <UserRound className="auth-input-icon h-4 w-4" aria-hidden />
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Abhishek Trivedi"
              className="auth-input auth-input-with-icon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-email" className="auth-label">
            Work email
          </label>
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon h-4 w-4" aria-hidden />
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@shaktitravels.in"
              className="auth-input auth-input-with-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-designation" className="auth-label">
            Designation <span className="auth-label-muted">(optional)</span>
          </label>
          <input
            id="reg-designation"
            name="designation"
            type="text"
            autoComplete="organization-title"
            placeholder="Fleet Manager, Accountant…"
            className="auth-input auth-input-plain"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-mobile" className="auth-label">
            Mobile <span className="auth-label-muted">(optional, for profile)</span>
          </label>
          <div className="auth-input-wrap">
            <span className="auth-input-prefix" aria-hidden>
              +91
            </span>
            <Phone className="auth-input-icon auth-input-icon-offset h-4 w-4" aria-hidden />
            <input
              id="reg-mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98765 43210"
              className="auth-input auth-input-with-prefix"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrap">
              <LockKeyhole className="auth-input-icon h-4 w-4" aria-hidden />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="auth-input auth-input-with-icon pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
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
          <div className="space-y-2">
            <label htmlFor="reg-confirm-password" className="auth-label">
              Confirm password
            </label>
            <div className="auth-input-wrap">
              <LockKeyhole className="auth-input-icon h-4 w-4" aria-hidden />
              <input
                id="reg-confirm-password"
                name="password_confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                className="auth-input auth-input-with-icon"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-accent auth-submit w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Register &amp; continue
            </>
          )}
        </button>

        <p className="auth-footer-text text-center">
          Already on the team?{' '}
          <button type="button" onClick={onGoLogin} className="auth-link font-semibold">
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

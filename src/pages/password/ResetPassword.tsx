import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import AuthShell from '../../components/AuthShell';
import PasswordInput from '../../components/PasswordInput';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The new password is what signs them in, so they are sent to do exactly that. The button
  // is there for anyone who would rather not wait.
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 3000);
    return () => window.clearTimeout(timer);
  }, [done, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response
        ? e.response.data?.detail ?? 'Could not set your password. Please try again.'
        : 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell footer="Still stuck? Your group admin can help.">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-700">This password reset link is incomplete.</p>
          <p className="mt-1 text-sm text-red-600">Open the link from your email again, or ask for a new one.</p>
        </div>
        <Link
          to="/forgot-password"
          className="mt-4 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-blue-700"
        >
          Ask for a new link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell footer="Contact your group admin to get access.">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Password changed</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in with your new password. The link you used is now spent.</p>
          <Link
            to="/login"
            replace
            className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell footer="Still stuck? Your group admin can help.">
      <h2 className="text-xl font-semibold text-gray-800">Set a new password</h2>
      <p className="mt-1.5 mb-6 text-sm text-gray-600">
        Choose a password of at least 8 characters. You will use it to sign in from now on.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
          {/* A spent or expired link is the likeliest thing to have gone wrong here, and
              there is nothing to be done on this page about it. */}
          <Link to="/forgot-password" className="mt-1.5 ml-6 block font-medium text-red-700 underline">
            Ask for a new link
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
            New password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition duration-150 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : 'Set new password'}
        </button>

        <Link to="/login" className="block text-center text-sm text-blue-600 transition hover:text-blue-700 hover:underline">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

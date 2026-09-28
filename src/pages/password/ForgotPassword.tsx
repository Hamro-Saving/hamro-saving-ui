import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import AuthShell from '../../components/AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      // The server answers the same way for an address it knows and one it does not, so
      // anything that lands here is a real fault — a malformed address, or no server.
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response
        ? e.response.data?.detail ?? 'Could not send the reset link. Please try again.'
        : 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell footer="Still stuck? Your group admin can help.">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-800">Check your email</h2>

          {/* Deliberately conditional: the server will not say whether the address has an
              account, so neither may this page. */}
          <p className="mt-2 text-sm text-gray-600">
            If <span className="font-medium text-gray-800">{email}</span> has an account, a link to set a
            new password is on its way. It works once and expires in an hour.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Nothing arrived? Check your spam folder, or try again with another address.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Back to sign in
            </Link>
            <button
              type="button"
              onClick={() => { setSent(false); setError(''); }}
              className="text-sm text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell footer="Still stuck? Your group admin can help.">
      <h2 className="text-xl font-semibold text-gray-800">Forgot your password?</h2>
      <p className="mt-1.5 mb-6 text-sm text-gray-600">
        Give us the email you sign in with and we will send you a link to set a new password.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="you@example.com"
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
              Sending…
            </>
          ) : 'Send reset link'}
        </button>

        <Link to="/login" className="block text-center text-sm text-blue-600 transition hover:text-blue-700 hover:underline">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

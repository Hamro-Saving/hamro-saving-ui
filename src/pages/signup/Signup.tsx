import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import type { SignupInfoResponse } from '../../api/types';
import Logo from '../../components/Logo';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<SignupInfoResponse | null>(null);
  const [infoError, setInfoError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setInfoError('Invalid or missing signup link.'); return; }
    authApi.getSignupInfo(token)
      .then(setInfo)
      // A link that the server rejected is genuinely spent; a request that never got
      // an answer is our problem, not theirs, and must not read as an expired invite.
      .catch((e: AxiosError) => setInfoError(
        e.response
          ? 'This signup link is invalid or has expired.'
          : 'Could not reach the server. Please try again, or ask your admin for a fresh invite.',
      ));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.signupWithToken(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Logo size="sm" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
        </div>

        {infoError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 text-sm font-medium">{infoError}</p>
            <button onClick={() => navigate('/login')} className="mt-3 text-sm text-blue-600 hover:underline">Go to Login</button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-emerald-700 font-semibold">Account created successfully!</p>
            <p className="text-emerald-600 text-sm mt-1">Redirecting to login...</p>
          </div>
        )}

        {info && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Signing up as</p>
              <p className="font-semibold text-gray-800">{info.fullName}</p>
              <p className="text-sm text-gray-600">{info.email}</p>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

            <div>
              <label className="text-xs text-gray-600 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

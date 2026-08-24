import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Chooses which group the person is acting in. Since roles ride in the token, switching
 * re-mints it, so the whole app drops to whatever role they hold in the group they picked.
 * Hidden until there is an actual choice to make.
 */
export default function GroupSwitcher() {
  const { user, switchGroup } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberships = user?.memberships ?? [];
  if (memberships.length < 2) return null;

  const onChange = async (groupId: string) => {
    if (groupId === user?.activeGroupId) return;
    setBusy(true);
    setError(null);
    try {
      await switchGroup(groupId);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Could not switch group.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-3 pt-4">
      <label htmlFor="group-switcher" className="block text-[11px] uppercase tracking-wide text-gray-500 mb-1.5 px-1">
        Acting in
      </label>
      <select
        id="group-switcher"
        value={user?.activeGroupId ?? ''}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
      >
        {memberships.map((m) => (
          <option key={m.groupId} value={m.groupId}>
            {m.groupName} — {m.groupRole}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1.5 px-1">{error}</p>}
    </div>
  );
}

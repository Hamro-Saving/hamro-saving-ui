import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groups';
import KpiCard from '../../components/KpiCard';
import { formatDate } from '../../utils/format';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getAll,
  });

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.isActive).length;
  const inactiveGroups = totalGroups - activeGroups;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform-wide summary across all groups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total Groups"
          value={totalGroups}
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <KpiCard
          label="Active Groups"
          value={activeGroups}
          color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="Inactive Groups"
          value={inactiveGroups}
          color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">All Groups</h2>
          <button
            onClick={() => navigate('/groups')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Groups →
          </button>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No groups yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{g.code.slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{g.name}</p>
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{g.code}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {g.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(g.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.memberCount}</p>
                    <p className="text-xs text-gray-400">members</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.memberInterestRate}%</p>
                    <p className="text-xs text-gray-400">member rate</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, satisfies } from '../routes';
import GroupSwitcher from './GroupSwitcher';
import Logo from './Logo';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Each axis is judged on its own, so someone who is both a platform admin and a member
  // of a group sees the platform pages and their group's pages together.
  const visibleItems = NAV_ITEMS.filter(item => satisfies(user, item.requires));

  const activeMembership = user?.memberships.find(m => m.groupId === user.activeGroupId);
  const subtitle = [user?.isSuperAdmin ? 'SuperAdmin' : null, activeMembership?.groupRole]
    .filter(Boolean)
    .join(' · ');

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-white hidden md:flex flex-col">
      <div className="px-4 py-4 border-b border-gray-700/50">
        <Logo variant="dark" size="lg" text={activeMembership?.groupName} />
      </div>
      <GroupSwitcher />
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item.icon}{item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-gray-700/50 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            {subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={logout} className="w-full text-left text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-2 px-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

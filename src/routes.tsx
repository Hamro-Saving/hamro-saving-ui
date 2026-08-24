import React from 'react';
import { participates } from './api/types';
import type { AuthUser } from './api/types';

/**
 * What a page requires of the caller. These mirror the server's authorization policies:
 * `superAdmin` is the platform axis and grants nothing inside a group, `groupAdmin` and
 * `groupMember` are the group axis and say nothing about the platform. A person who is
 * both simply satisfies both, and sees both sections of the app.
 */
export type Requirement = 'superAdmin' | 'groupAdmin' | 'groupMember' | 'nonMember';

export interface RouteAccess {
  path: string;
  /** Sidebar label; omitted for pages that should not appear in navigation. */
  label?: string;
  requires: Requirement;
  icon?: React.ReactNode;
}

export function satisfies(user: AuthUser | null, requirement: Requirement): boolean {
  if (!user) return false;

  switch (requirement) {
    case 'superAdmin':
      return user.isSuperAdmin;
    case 'groupAdmin':
      return user.groupRole === 'Admin';
    case 'groupMember':
      // Admins are members who also run the group, so they satisfy this too.
      return participates(user.groupRole);
    case 'nonMember':
      return user.groupRole === 'NonMember';
  }
}

/** Where a person lands when they have no destination of their own. */
export function getDefaultRoute(user: AuthUser | null): string {
  if (!user) return '/login';
  if (user.groupRole === 'NonMember') return '/my-loan';
  if (user.activeGroupId) return '/dashboard';
  if (user.isSuperAdmin) return '/overview';
  return '/login';
}

const icon = (d: string) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

/**
 * The one place route access is declared. The router, the sidebar and the guard all read
 * this, so they cannot drift apart.
 */
export const ROUTES: RouteAccess[] = [
  {
    path: '/overview', label: 'Overview', requires: 'superAdmin',
    icon: icon('M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'),
  },
  {
    path: '/groups', label: 'Groups', requires: 'superAdmin',
    icon: icon('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'),
  },
  { path: '/groups/:id', requires: 'superAdmin' },
  {
    path: '/dashboard', label: 'Dashboard', requires: 'groupMember',
    icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'),
  },
  {
    path: '/members', label: 'Members', requires: 'groupMember',
    icon: icon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'),
  },
  {
    path: '/savings', label: 'Deposits', requires: 'groupMember',
    icon: icon('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  {
    path: '/loans', label: 'Loans', requires: 'groupMember',
    icon: icon('M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z'),
  },
  { path: '/loans/:id', requires: 'groupMember' },
  {
    path: '/finance', label: 'Finance', requires: 'groupAdmin',
    icon: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
  },
  {
    path: '/verify', label: 'Verify', requires: 'groupAdmin',
    icon: icon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  {
    path: '/my-loan', label: 'My Loan', requires: 'nonMember',
    icon: icon('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'),
  },
];

/** Sidebar order: platform section first, then the group the person is acting in. */
export const NAV_ITEMS = ROUTES.filter((r) => r.label);

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon, UsersIcon, CreditCardIcon, TrophyIcon,
  DocumentChartBarIcon, Bars3Icon, XMarkIcon,
  SunIcon, MoonIcon, ArrowRightOnRectangleIcon,
  BanknotesIcon, ChartPieIcon, Cog6ToothIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard', exact: true },
  { to: '/members', icon: UsersIcon, label: 'Members' },
  { to: '/chitgroups', icon: ChartPieIcon, label: 'Chit Groups' },
  { to: '/payments', icon: CreditCardIcon, label: 'Payments' },
  { to: '/draws', icon: TrophyIcon, label: 'Draw System' },
  { to: '/reports', icon: DocumentChartBarIcon, label: 'Reports' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow">
            <BanknotesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">ChitFund</h1>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-4 mb-3">Main Menu</p>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-gray-800/60">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-sm">
            {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            {dark ? 'Light' : 'Dark'}
          </button>
          <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white dark:bg-gray-900 h-full flex flex-col animate-slide-in-right">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800">
              <XMarkIcon className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button onClick={toggle} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500">
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

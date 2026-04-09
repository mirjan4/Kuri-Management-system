import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import ChitGroupsPage from './pages/ChitGroupsPage';
import ChitGroupDetailPage from './pages/ChitGroupDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import DrawsPage from './pages/DrawsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import MemberLoginPage from './pages/MemberLoginPage';
import MemberDashboardPage from './pages/MemberDashboardPage';

const PrivateRoute = ({ children, requireRole }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading ChitFund...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  
  const isMember = user?.role === 'member';

  if (requireRole === 'admin' && isMember) {
     return <Navigate to="/member-dashboard" replace />;
  }
  
  if (requireRole === 'member' && !isMember) {
     return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  
  if (user?.role === 'member') return <Navigate to="/member-dashboard" replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 3000,
            }} 
          />
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/login/member" element={<PublicRoute><MemberLoginPage /></PublicRoute>} />
            {/* Admin Routes */}
            <Route path="/" element={<PrivateRoute requireRole="admin"><Layout /></PrivateRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="chitgroups" element={<ChitGroupsPage />} />
              <Route path="chitgroups/:id" element={<ChitGroupDetailPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="draws" element={<DrawsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Member Routes */}
            <Route path="/member-dashboard" element={<PrivateRoute requireRole="member"><MemberDashboardPage /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

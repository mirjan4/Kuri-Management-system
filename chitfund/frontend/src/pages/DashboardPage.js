import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  UsersIcon, ChartPieIcon, BanknotesIcon, TrophyIcon,
  ClockIcon, ArrowRightIcon, CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#c026d3','#10b981','#f59e0b','#3b82f6'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!stats) return <div className="text-center py-20 text-slate-400">Failed to load dashboard</div>;

  const trendData = MONTHS.map((m, i) => {
    const found = stats.monthlyTrend?.find(t => t._id === i + 1);
    return { month: m, amount: found?.total || 0, count: found?.count || 0 };
  });

  const pieData = stats.groupStats?.map(g => ({
    name: g._id, value: g.count
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
          <span className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">System Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={stats.totalMembers} icon={UsersIcon} color="brand"
          subtitle="Active members" />
        <StatCard title="Active Chit Groups" value={stats.activeGroups} icon={ChartPieIcon} color="violet"
          subtitle={`${stats.totalGroups} total groups`} />
        <StatCard title="Monthly Collection" value={`₹${(stats.totalMonthlyCollection/1000).toFixed(1)}K`}
          icon={BanknotesIcon} color="gold" subtitle="This month" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={ClockIcon} color="rose"
          subtitle="Awaiting collection" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Collection Trend */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Collection Trend</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{new Date().getFullYear()} monthly overview</p>
            </div>
            <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-semibold">
              This Year
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c026d3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c026d3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Collection']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'var(--tw-prose-body, #1e293b)' }} />
              <Area type="monotone" dataKey="amount" stroke="#c026d3" strokeWidth={2.5}
                fill="url(#colorAmount)" dot={{ fill: '#c026d3', strokeWidth: 2, r: 3 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Group Status Pie */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Group Status</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Distribution</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize text-slate-600 dark:text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">No group data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Winners */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-500/10 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-4 h-4 text-gold-500" />
              </div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Recent Winners</h2>
            </div>
            <button onClick={() => navigate('/draws')} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          {stats.recentWinners?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentWinners.map((w, i) => (
                <div key={w._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {w.member?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{w.member?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{w.chitGroup?.name} • Month {w.monthIndex}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{w.prizeAmount?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{format(new Date(w.drawDate || w.createdAt), 'dd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <TrophyIcon className="w-12 h-12 text-slate-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No draws conducted yet</p>
            </div>
          )}
        </div>

        {/* Payment Bar Chart */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Payment Count</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Number of payments per month</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="count" fill="#c026d3" radius={[6, 6, 0, 0]} name="Payments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

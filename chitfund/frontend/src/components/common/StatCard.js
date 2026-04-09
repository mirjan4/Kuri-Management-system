import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'brand', trend, subtitle }) {
  const colors = {
    brand: 'from-brand-500 to-brand-700 shadow-glow',
    gold: 'from-gold-400 to-gold-600 shadow-glow-gold',
    emerald: 'from-emerald-400 to-emerald-600',
    blue: 'from-blue-400 to-blue-600',
    rose: 'from-rose-400 to-rose-600',
    violet: 'from-violet-400 to-violet-600',
  };

  return (
    <div className="card p-6 animate-fade-in hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 animate-count-up">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

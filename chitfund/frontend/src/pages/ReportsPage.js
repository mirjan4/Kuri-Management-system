import React, { useState, useEffect } from 'react';
import { DocumentChartBarIcon, ArrowDownTrayIcon, TrophyIcon, UsersIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const REPORT_TYPES = [
  { id: 'payments', label: 'Payment Report', icon: CreditCardIcon, color: 'brand', desc: 'All payment transactions with status' },
  { id: 'winners', label: 'Winner History', icon: TrophyIcon, color: 'gold', desc: 'Complete list of all draw winners' },
  { id: 'members', label: 'Members List', icon: UsersIcon, color: 'emerald', desc: 'All registered members with details' },
];

export default function ReportsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    api.get('/chitgroups?limit=100').then(r => setGroups(r.data.data));
    api.get('/reports/winners').then(r => setWinners(r.data.data)).finally(() => setLoadingWinners(false));
  }, []);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = new URLSearchParams({ type });
      if (selectedGroup && type !== 'members') params.set('groupId', selectedGroup);
      const res = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const colors = {
    brand: 'from-brand-500 to-brand-600',
    gold: 'from-gold-400 to-gold-600',
    emerald: 'from-emerald-400 to-emerald-600',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Export and analyze your chit fund data</p>
      </div>

      {/* Export Section */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 dark:text-white mb-2">Export to Excel</h2>
        <p className="text-slate-500 text-sm mb-5">Download detailed reports in Excel format</p>

        <div className="mb-4">
          <label className="label">Filter by Chit Group (optional)</label>
          <select className="input w-64" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REPORT_TYPES.map(({ id, label, icon: Icon, color, desc }) => (
            <div key={id} className="border border-slate-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{label}</h3>
              <p className="text-xs text-slate-400 mb-4">{desc}</p>
              <button onClick={() => handleExport(id)} disabled={exporting === id}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                {exporting === id ? (
                  <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> Exporting...</>
                ) : (
                  <><ArrowDownTrayIcon className="w-4 h-4" /> Download Excel</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Winner History Report */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500/10 rounded-xl flex items-center justify-center">
              <TrophyIcon className="w-4 h-4 text-gold-500" />
            </div>
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Winner History Report</h2>
          </div>
          <span className="badge-active">{winners.length} winners</span>
        </div>

        {loadingWinners ? <LoadingSpinner /> : winners.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No winners yet</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Winner</th>
                  <th>Chit Group</th>
                  <th>Month</th>
                  <th>Prize</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w, i) => (
                  <tr key={w._id}>
                    <td className="font-mono text-slate-400">#{i+1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {w.member?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{w.member?.name}</p>
                          <p className="text-xs text-slate-400">{w.member?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-brand-600 dark:text-brand-400 font-medium">{w.chitGroup?.name}</td>
                    <td className="font-mono">Month {w.monthIndex}</td>
                    <td className="font-bold text-emerald-600 dark:text-emerald-400">₹{w.prizeAmount?.toLocaleString()}</td>
                    <td className="text-xs text-slate-500">{w.drawDate ? format(new Date(w.drawDate), 'dd MMM yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <DocumentChartBarIcon className="w-8 h-8 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{groups.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Chit Groups</p>
        </div>
        <div className="card p-5 text-center">
          <TrophyIcon className="w-8 h-8 text-gold-500 mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{winners.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Winners</p>
        </div>
        <div className="card p-5 text-center">
          <CreditCardIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            ₹{(winners.reduce((s, w) => s + (w.prizeAmount || 0), 0) / 100000).toFixed(1)}L
          </p>
          <p className="text-sm text-slate-500 mt-1">Total Prize Money Distributed</p>
        </div>
      </div>
    </div>
  );
}

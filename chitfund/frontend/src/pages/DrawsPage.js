import React, { useState, useEffect } from 'react';
import { TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function DrawsPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/draws'),
      api.get('/chitgroups?limit=100'),
    ]).then(([w, g]) => {
      setWinners(w.data.data);
      setGroups(g.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const validWinners = winners.filter(w => w.member && w.chitGroup);
  const filteredWinners = selectedGroup ? validWinners.filter(w => w.chitGroup?._id === selectedGroup) : validWinners;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Draw System</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">View all draw results and winners</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-200 dark:border-gold-800 rounded-xl">
          <TrophyIcon className="w-5 h-5 text-gold-500" />
          <span className="font-bold text-gold-700 dark:text-gold-400">{winners.length} total winners</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card p-5 bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 border-brand-100 dark:border-brand-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-brand-800 dark:text-brand-300">Conducting Draws</p>
            <p className="text-brand-600 dark:text-brand-400 text-sm mt-1">
              Go to <strong>Chit Groups → View Details → Draw tab</strong> to conduct the lottery draw for each group. 
              The system ensures each member wins only once and randomly selects from eligible members.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <select className="input w-56" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
          <option value="">All Chit Groups</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      {/* Winners Grid */}
      {loading ? <LoadingSpinner /> : filteredWinners.length === 0 ? (
        <div className="card p-16 text-center">
          <TrophyIcon className="w-16 h-16 text-slate-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium text-lg">No winners yet</p>
          <p className="text-slate-300 dark:text-gray-600 text-sm mt-1">Conduct draws from the Chit Group detail page</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium for most recent */}
          {filteredWinners.length >= 3 && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">🏆 Recent Winners Spotlight</h2>
              <div className="flex items-end justify-center gap-4">
                {[filteredWinners[1], filteredWinners[0], filteredWinners[2]].map((w, i) => {
                  const heights = ['h-28', 'h-36', 'h-24'];
                  const colors = ['bg-slate-300 dark:bg-gray-600', 'bg-gold-400', 'bg-amber-600'];
                  const labels = ['2nd', '1st', '3rd'];
                  return w ? (
                    <div key={w._id} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {w.member?.name?.[0]}
                      </div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-white truncate max-w-24 text-center">{w.member?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{w.chitGroup?.name}</p>
                      <div className={`w-full ${heights[i]} ${colors[i]} rounded-t-xl flex items-start justify-center pt-3`}>
                        <span className="text-white font-bold text-lg">{labels[i]}</span>
                      </div>
                    </div>
                  ) : <div key={i} className="flex-1" />;
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Winner</th>
                    <th>Chit Group</th>
                    <th>Month</th>
                    <th>Prize Amount</th>
                    <th>Draw Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWinners.map((w, i) => (
                    <tr key={w._id}>
                      <td>
                        <span className="font-mono font-bold text-slate-400 dark:text-slate-500">#{i + 1}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-glow-gold">
                            {w.member?.name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{w.member?.name}</p>
                            <p className="text-xs text-slate-400">{w.member?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-brand-600 dark:text-brand-400">{w.chitGroup?.name}</span>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Month {w.monthIndex}</span>
                      </td>
                      <td>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">₹{w.prizeAmount?.toLocaleString()}</span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {w.drawDate ? format(new Date(w.drawDate), 'dd MMM yyyy, hh:mm a') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

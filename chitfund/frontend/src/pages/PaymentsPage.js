import React, { useState, useEffect, useCallback } from 'react';
import { CreditCardIcon, FunnelIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupDetail, setGroupDetail] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    api.get('/chitgroups?limit=100').then(r => {
      setGroups(r.data.data);
      if (r.data.data.length > 0) setSelectedGroup(r.data.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const g = groups.find(g => g._id === selectedGroup);
      setGroupDetail(g);
      setSelectedMonth(g?.currentMonth || 1);
    }
  }, [selectedGroup, groups]);

  const fetchPayments = useCallback(async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await api.get(`/payments/group/${selectedGroup}?monthIndex=${selectedMonth}`);
      setPayments(res.data.data);
      setSelectedIds([]);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [selectedGroup, selectedMonth]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const togglePayment = async (p) => {
    const newStatus = p.status === 'paid' ? 'unpaid' : 'paid';
    try {
      await api.put(`/payments/${p._id}`, { status: newStatus, paymentMode: 'cash' });
      toast.success(`Marked ${newStatus}`);
      fetchPayments();
    } catch { toast.error('Update failed'); }
  };

  const bulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.put('/payments/bulk', { paymentIds: selectedIds, status: 'paid', paymentMode: 'cash' });
      toast.success(`${selectedIds.length} payments marked as paid`);
      fetchPayments();
    } catch { toast.error('Bulk update failed'); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === payments.length ? [] : payments.map(p => p._id));

  const paid = payments.filter(p => p.status === 'paid');
  const unpaid = payments.filter(p => p.status === 'unpaid');
  const totalCollected = paid.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Payments</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Track and manage monthly collections</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          <select className="input w-48" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">Select Chit Group</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          {groupDetail && (
            <select className="input w-36" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: groupDetail.totalMonths }, (_, i) => (
                <option key={i+1} value={i+1}>Month {i+1}</option>
              ))}
            </select>
          )}
          {selectedIds.length > 0 && (
            <button onClick={bulkMarkPaid} className="btn-success flex items-center gap-2 text-sm ml-auto">
              <CheckCircleIcon className="w-4 h-4" /> Mark {selectedIds.length} as Paid
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {groupDetail && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Members</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{payments.length}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-emerald-500 mb-1">Paid</p>
            <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">{paid.length}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-red-500 mb-1">Unpaid</p>
            <p className="text-2xl font-display font-bold text-red-500 dark:text-red-400">{unpaid.length}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Collected</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">₹{(totalCollected/1000).toFixed(1)}K</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {payments.length > 0 && (
        <div className="card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Collection Progress</span>
            <span className="text-slate-500">{Math.round((paid.length / payments.length) * 100)}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(paid.length / payments.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : payments.length === 0 ? (
          <div className="text-center py-16">
            <CreditCardIcon className="w-14 h-14 text-slate-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No payment records found</p>
            <p className="text-slate-300 dark:text-gray-600 text-sm mt-1">Select a chit group and month to view payments</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" className="rounded" checked={selectedIds.length === payments.length}
                      onChange={toggleAll} />
                  </th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Mode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id} className={selectedIds.includes(p._id) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}>
                    <td>
                      <input type="checkbox" className="rounded" checked={selectedIds.includes(p._id)}
                        onChange={() => toggleSelect(p._id)} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${p.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                          {p.member?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.member?.name}</p>
                          <p className="text-xs text-slate-400">{p.member?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono font-semibold">₹{p.amount?.toLocaleString()}</td>
                    <td><span className={p.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>{p.status}</span></td>
                    <td className="text-xs">{p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}</td>
                    <td className="capitalize text-xs text-slate-500">{p.paymentMode || '—'}</td>
                    <td>
                      <button onClick={() => togglePayment(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${p.status === 'paid'
                          ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20'}`}>
                        {p.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

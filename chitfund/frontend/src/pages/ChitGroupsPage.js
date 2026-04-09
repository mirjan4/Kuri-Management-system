import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, TrashIcon, ChartPieIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i - 1);

const EMPTY_FORM = { 
  name: '', 
  totalMembers: '', 
  monthlyAmount: '', 
  totalMonths: '', 
  startDate: '', 
  cycleMode: 'MONTHLY',
  startMonth: MONTHS[new Date().getMonth()],
  startYear: new Date().getFullYear().toString(),
  cycleDuration: 7,
  commission: 5, 
  description: '' 
};

const STATUS_FILTERS = ['all', 'active', 'pending', 'completed'];

export default function ChitGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/chitgroups?${params}`);
      setGroups(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load chit groups'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openAdd = () => {
    setEditGroup(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (g) => {
    setEditGroup(g);
    let startMonth = MONTHS[new Date().getMonth()];
    let startYear = new Date().getFullYear().toString();
    let startDateForm = '';

    if (g.cycleMode === 'MONTHLY' && g.startDate) {
      const d = new Date(g.startDate);
      startMonth = MONTHS[d.getMonth()];
      startYear = d.getFullYear().toString();
    } else if (g.startDate) {
      startDateForm = g.startDate.slice(0, 10);
    }

    setForm({
      name: g.name,
      totalMembers: g.totalMembers,
      monthlyAmount: g.monthlyAmount,
      totalMonths: g.totalMonths,
      startDate: startDateForm,
      cycleMode: g.cycleMode || 'MONTHLY',
      startMonth,
      startYear,
      cycleDuration: g.cycleDuration || 7,
      commission: g.commission,
      description: g.description || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const monthMap = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
      const finalForm = { ...form };
      
      if (form.cycleMode === 'MONTHLY') {
        const monthNum = monthMap[form.startMonth] || '01';
        finalForm.startDate = `${form.startYear}-${monthNum}-01`;
      }

      if (editGroup) {
        await api.put(`/chitgroups/${editGroup._id}`, finalForm);
        toast.success('Chit group updated!');
      } else {
        await api.post('/chitgroups', finalForm);
        toast.success('Chit group created!');
      }
      
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving group'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/chitgroups/${deleteId}`);
      toast.success('Chit group deleted');
      fetchGroups();
    } catch { toast.error('Failed to delete group'); }
  };

  const statusBadge = (s) => {
    if (s === 'active') return <span className="badge-active">Active</span>;
    if (s === 'pending') return <span className="badge-pending">Pending</span>;
    if (s === 'completed') return <span className="badge-completed">Completed</span>;
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Chit Groups</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{total} groups total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-brand-600 text-white shadow-glow' : 'bg-white dark:bg-gray-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.length === 0 ? (
            <div className="col-span-full card p-16 text-center">
              <ChartPieIcon className="w-14 h-14 text-slate-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No chit groups found</p>
              <button onClick={openAdd} className="btn-primary mt-4 mx-auto inline-flex items-center gap-2">
                <PlusIcon className="w-4 h-4" /> Create First Group
              </button>
            </div>
          ) : groups.map(g => {
            const filled = g.members?.length || 0;
            const fillPct = Math.round((filled / g.totalMembers) * 100);
            const monthlyPool = g.monthlyAmount * g.totalMembers;
            return (
              <div key={g._id} className="card p-5 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">{g.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {g.cycleMode === 'MONTHLY' 
                        ? `Starts ${g.startMonth} ${g.startYear}` 
                        : `Starts ${g.startDate ? format(new Date(g.startDate), 'dd MMM yyyy') : '—'}`}
                    </p>
                  </div>
                  {statusBadge(g.status)}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">Monthly</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">₹{g.monthlyAmount?.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">Months</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{g.totalMonths}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">Pool</p>
                    <p className="font-bold text-brand-600 dark:text-brand-400 text-sm">₹{(monthlyPool/1000).toFixed(1)}K</p>
                  </div>
                </div>

                {/* Member fill bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{filled}/{g.totalMembers} members</span>
                    <span>{fillPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                      style={{ width: `${fillPct}%` }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => navigate(`/chitgroups/${g._id}`)}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm py-2">
                    <EyeIcon className="w-4 h-4" /> View Details
                  </button>
                  <button onClick={() => openEdit(g)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors" title="Edit Group">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteId(g._id)}
                    className="p-2 rounded-xl border border-red-100 dark:border-red-900/30 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Group">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editGroup ? "Edit Chit Group" : "Create Chit Group"}>
        {editGroup && editGroup.status !== 'pending' && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg text-xs font-semibold">
            ⚠️ This group is already {editGroup.status}. Critical fields (Amount, Members, Dates) are locked to preserve calculations.
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Group Name *</label>
            <input className="input" placeholder="e.g. Gold Chit 2024" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Members *</label>
              <input className="input disabled:bg-slate-50 disabled:text-slate-400" type="number" min="2" placeholder="20" required
                disabled={editGroup && editGroup.status !== 'pending'}
                value={form.totalMembers} onChange={e => setForm(f => ({ ...f, totalMembers: e.target.value }))} />
            </div>
            <div>
              <label className="label">Monthly Amount (₹) *</label>
              <input className="input disabled:bg-slate-50 disabled:text-slate-400" type="number" min="100" placeholder="5000" required
                disabled={editGroup && editGroup.status !== 'pending'}
                value={form.monthlyAmount} onChange={e => setForm(f => ({ ...f, monthlyAmount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Months *</label>
              <input className="input disabled:bg-slate-50 disabled:text-slate-400" type="number" min="2" placeholder="20" required
                disabled={editGroup && editGroup.status !== 'pending'}
                value={form.totalMonths} onChange={e => setForm(f => ({ ...f, totalMonths: e.target.value }))} />
            </div>
            <div>
              <label className="label">Commission (%)</label>
              <input className="input" type="number" min="0" max="20" step="0.5"
                value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cycle Mode *</label>
              <select className="input disabled:bg-slate-50 disabled:text-slate-400" required 
                disabled={editGroup && editGroup.status !== 'pending'}
                value={form.cycleMode} onChange={e => setForm(f => ({ ...f, cycleMode: e.target.value }))}>
                <option value="MONTHLY">Monthly (JAN-DEC)</option>
                <option value="WEEKLY">Weekly (7 Days)</option>
                <option value="BI-WEEKLY">Bi-Weekly (14 Days)</option>
                <option value="CUSTOM">Custom Mode (Flexible Days)</option>
              </select>
            </div>

            {form.cycleMode === 'MONTHLY' ? (
              <>
                <div>
                  <label className="label">Start Month *</label>
                  <select className="input disabled:bg-slate-50 disabled:text-slate-400" required 
                    disabled={editGroup && editGroup.status !== 'pending'}
                    value={form.startMonth} onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Start Year *</label>
                  <select className="input disabled:bg-slate-50 disabled:text-slate-400" required 
                    disabled={editGroup && editGroup.status !== 'pending'}
                    value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))}>
                    {YEARS.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className={form.cycleMode === 'CUSTOM' ? '' : 'col-span-2'}>
                  <label className="label">Start Date *</label>
                  <input className="input disabled:bg-slate-50 disabled:text-slate-400" type="date" required 
                    disabled={editGroup && editGroup.status !== 'pending'}
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                {form.cycleMode === 'CUSTOM' && (
                  <div>
                    <label className="label">Duration (Days) *</label>
                    <input className="input disabled:bg-slate-50 disabled:text-slate-400" type="number" min="1" 
                      disabled={editGroup && editGroup.status !== 'pending'}
                      value={form.cycleDuration} onChange={e => setForm(f => ({ ...f, cycleDuration: e.target.value }))} />
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional notes..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          {form.totalMembers && form.monthlyAmount && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 text-sm">
              <p className="font-semibold text-brand-700 dark:text-brand-300 mb-2">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-brand-600 dark:text-brand-400">
                <span>Monthly Pool: <strong>₹{(form.totalMembers * form.monthlyAmount).toLocaleString()}</strong></span>
                <span>Total Value: <strong>₹{(form.totalMembers * form.monthlyAmount * form.totalMonths).toLocaleString()}</strong></span>
                <span>Prize (after commission): <strong>₹{Math.round(form.totalMembers * form.monthlyAmount * (1 - form.commission/100)).toLocaleString()}</strong></span>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editGroup ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Chit Group" message="This will permanently delete the chit group and all related data." danger confirmText="Delete" />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', aadhar: '', joinDate: '', isActive: true };

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      const res = await api.get(`/members?${params}`);
      setMembers(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openAdd = () => { setEditMember(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (m) => {
    setEditMember(m);
    setForm({ 
      name: m.name, phone: m.phone, email: m.email || '', 
      address: m.address || '', aadhar: m.aadhar || '', 
      joinDate: m.joinDate ? m.joinDate.slice(0, 10) : '',
      isActive: m.isActive
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMember) {
        await api.put(`/members/${editMember._id}`, form);
        toast.success('Member updated');
      } else {
        await api.post('/members', form);
        toast.success('Member added');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving member'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/members/${deleteId}`);
      toast.success('Member deleted successfully');
      fetchMembers();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete member'); 
    } finally {
      setDeleteId(null);
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Members</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{total} total members</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-10" placeholder="Search by name, phone, or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Chit Groups</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12">
                      <UserIcon className="w-12 h-12 text-slate-200 dark:text-gray-700 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No members found</p>
                    </td></tr>
                  ) : members.map(m => (
                    <tr key={m._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{m.name}</p>
                            <p className="text-xs text-slate-400">{m.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
                          <PhoneIcon className="w-3.5 h-3.5" /> {m.phone}
                        </a>
                      </td>
                      <td className="max-w-32 truncate">{m.address || '—'}</td>
                      <td>
                        <span className="font-semibold text-slate-800 dark:text-white">{m.chitGroups?.length || 0}</span>
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {m.joinDate ? format(new Date(m.joinDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td>
                        <span className={m.isActive ? 'badge-active' : 'badge-unpaid'}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-400 hover:text-brand-600 transition-colors">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(m._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-gray-800">
                <p className="text-sm text-slate-500">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">Prev</button>
                  <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="btn-secondary px-3 py-1.5 text-sm">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMember ? 'Edit Member' : 'Add New Member'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Enter full name" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" placeholder="10-digit mobile" required
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea className="input resize-none" rows={2} placeholder="Full address"
                value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="label">Aadhar Number</label>
              <input className="input font-mono" placeholder="XXXX XXXX XXXX"
                value={form.aadhar} onChange={e => setForm(f => ({ ...f, aadhar: e.target.value }))} />
            </div>
            <div>
              <label className="label">Join Date</label>
              <input className="input" type="date"
                value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
            </div>
            {editMember && (
              <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                <div>
                  <label className="font-bold text-sm text-slate-800 dark:text-white">Account Status</label>
                  <p className="text-xs text-slate-500">Enable or disable member access</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} title="Delete Member permanently"
        message="This will completely delete this member from the database. Note: You cannot delete a member if they are currently enrolled in any Chit Groups." danger
        confirmText="Delete permanently" />
    </div>
  );
}

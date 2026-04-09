import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, UserMinusIcon, TrophyIcon, CheckCircleIcon, XCircleIcon, ShareIcon, ChatBubbleLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SpinWheelDraw from '../components/common/SpinWheelDraw';
import WinnerPoster from '../components/common/WinnerPoster';
import { generateCycles } from '../utils/cycleHelper';
import { format } from 'date-fns';

const TABS = ['Overview', 'Members', 'Payments', 'Draw'];

export default function ChitGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [payments, setPayments] = useState([]);
  const [winners, setWinners] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [bulkCount, setBulkCount] = useState('');
  const [drawModal, setDrawModal] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [conducting, setConducting] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [lastWinner, setLastWinner] = useState(null);
  const [posterData, setPosterData] = useState(null);
  const [globalPaymentDate, setGlobalPaymentDate] = useState(new Date().toISOString().substring(0, 10));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, wRes] = await Promise.all([
        api.get(`/chitgroups/${id}`),
        api.get(`/draws?groupId=${id}`)
      ]);
      const gData = gRes.data.data;
      setGroup(gData);
      setWinners(wRes.data.data);
      setCycles(generateCycles(gData));
      
      // Default to current month but prevent fetching out of bounds
      setSelectedMonth(gData.currentMonth > gData.totalMonths ? gData.totalMonths : (gData.currentMonth || 1));
    } catch { toast.error('Failed to load group'); }
    finally { setLoading(false); }
  }, [id]);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get(`/payments/group/${id}?monthIndex=${selectedMonth}`);
      setPayments(res.data.data);
    } catch { toast.error('Failed to load payments'); }
  }, [id, selectedMonth]);

  const fetchAllMembers = async () => {
    const res = await api.get('/members?limit=200');
    setAllMembers(res.data.data.filter(m => m.isActive && !group?.members?.find(gm => gm.member?._id === m._id)));
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchPayments(); }, [fetchPayments, selectedMonth]);

  const handleAddMember = async () => {
    let idsToAdd = [...selectedMemberIds];
    
    // If a bulk count was specified and no specific members selected
    if (bulkCount && idsToAdd.length === 0) {
      const count = parseInt(bulkCount);
      if (isNaN(count) || count <= 0) return toast.error('Enter a valid number');
      idsToAdd = allMembers.slice(0, Math.min(count, group.totalMembers - group.members.length)).map(m => m._id);
    }

    if (idsToAdd.length === 0) return toast.error('No members selected');
    
    try {
      // Loop sequentially to avoid MongoDB race conditions generating duplicate Ticket Numbers
      for (const memberId of idsToAdd) {
        await api.post(`/chitgroups/${id}/members`, { memberId });
      }
      
      toast.success(`${idsToAdd.length} member(s) added successfully!`);
      setAddMemberModal(false);
      setSelectedMemberIds([]);
      setBulkCount('');
      fetchAll();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to add members'); 
    } finally {
      setConducting(false);
    }
  };

  const toggleMemberSelection = (id) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleRemoveMember = async () => {
    try {
      await api.delete(`/chitgroups/${id}/members/${removeId}`);
      toast.success('Member removed');
      fetchAll();
    } catch { toast.error('Failed to remove member'); }
  };

  const handlePaymentToggle = async (payment) => {
    const newStatus = payment.status === 'paid' ? 'unpaid' : 'paid';
    try {
      const payload = { status: newStatus, paymentMode: 'cash' };
      if (newStatus === 'paid') {
        payload.paymentDate = new Date(globalPaymentDate).toISOString();
      }
      await api.put(`/payments/${payment._id}`, payload);
      toast.success(`Marked as ${newStatus}`);
      fetchPayments();
    } catch { toast.error('Failed to update payment'); }
  };

  const conductDraw = async () => {
    setConducting(true);
    try {
      const res = await api.post(`/draws/${id}/conduct`, { monthIndex: selectedMonth });
      setLastWinner(res.data.data);
      toast.success(res.data.message, { duration: 5000 });
      fetchAll();
      // We don't close the draw modal here anymore, the SpinWheel component handles its own completion
      return res.data.data;
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Draw failed'); 
      throw err;
    }
    finally { setConducting(false); }
  };

  const handleShareWhatsApp = () => {
    let msg = `📢 *${group.name} Update*\n\n`;
    msg += `📅 Month: *${cycles[selectedMonth - 1]?.label || `Cycle ${selectedMonth}`}*\n\n`;

    // We want to sort the list? Let's just print in order.
    group.members?.forEach(gm => {
      const isWinner = winners.find(w => w.monthIndex === selectedMonth && w.member?._id === gm.member._id);
      const payment = payments.find(p => p.member?._id === gm.member._id);
      const isPaid = payment?.status === 'paid';
      
      let statusSuffix = isPaid ? '✅' : '❌'; // Unpaid is Cross
      if (isWinner) statusSuffix = '🔥 (Winner)';

      msg += `${gm.member?.name} ${statusSuffix}\n`;
    });

    msg += `\nThank you`;
    
    // Open in WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <LoadingSpinner />;
  if (!group) return <div className="text-center py-20 text-slate-400">Group not found</div>;

  const monthlyPool = group.monthlyAmount * group.totalMembers;
  const collectedThisMonth = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const currentWinner = winners.find(w => w.monthIndex === selectedMonth);

  // Dynamically calculate eligible members on frontend side so it perfectly respects payment toggles
  const derivedEligible = group.members.filter(gm => {
    const hasWon = winners.some(w => w.member?._id === gm.member._id);
    const hasPaid = payments.some(p => p.member?._id === gm.member._id && p.status === 'paid');
    return !hasWon && hasPaid;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chitgroups')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{group.name}</h1>
            <span className={group.status === 'active' ? 'badge-active' : group.status === 'pending' ? 'badge-pending' : 'badge-completed'}>
              {group.status}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {group.members?.length}/{group.totalMembers} members • ₹{group.monthlyAmount?.toLocaleString()}/month • {group.totalMonths} months
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Pool', value: `₹${monthlyPool.toLocaleString()}` },
            { label: 'Total Value', value: `₹${(monthlyPool * group.totalMonths / 100000).toFixed(2)}L` },
            { 
              label: 'Current Period', 
              value: group.status === 'completed' 
                ? 'Completed' 
                : (cycles[group.currentMonth - 1]?.label || `${Math.min(group.currentMonth, group.totalMonths)}/${group.totalMonths}`) 
            },
            { label: 'Winners So Far', value: winners.length },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}

          {lastWinner && (
            <div className="col-span-full card p-6 bg-gradient-to-r from-gold-500/10 to-amber-500/10 border-gold-200 dark:border-amber-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-glow-gold animate-bounce-light">
                  🏆
                </div>
                <div>
                  <p className="text-xs font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider">Latest Winner</p>
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{lastWinner.member?.name}</p>
                  <p className="text-slate-500 text-sm">Won ₹{lastWinner.prizeAmount?.toLocaleString()} in Month {lastWinner.monthIndex}</p>
                </div>
              </div>
            </div>
          )}

          {/* Winners list */}
          <div className="col-span-full card p-6">
            <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4">Winner History</h3>
            {winners.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No draws conducted yet</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Month</th><th>Winner</th><th>Phone</th><th>Prize Amount</th><th>Draw Date</th><th className="text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {winners.map(w => {
                      const cycleLabel = cycles[w.monthIndex - 1]?.label || `#${w.monthIndex}`;
                      return (
                        <tr key={w._id}>
                          <td><span className="font-mono font-bold text-brand-600 dark:text-brand-400">{cycleLabel}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{w.member?.name?.[0]}</div>
                              <span className="font-semibold">{w.member?.name}</span>
                            </div>
                          </td>
                          <td>{w.member?.phone}</td>
                          <td><span className="font-bold text-emerald-600 dark:text-emerald-400">₹{w.prizeAmount?.toLocaleString()}</span></td>
                          <td className="text-xs">{w.drawDate ? format(new Date(w.drawDate), 'dd MMM yyyy') : '—'}</td>
                          <td className="text-right">
                             <button 
                               onClick={() => setPosterData({ winner: w, prizeAmount: w.prizeAmount, cycleLabel, groupName: group.name })}
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 dark:bg-gray-800 dark:hover:bg-brand-900/20 text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 rounded-lg text-xs font-bold transition-colors"
                             >
                               <PhotoIcon className="w-4 h-4" /> Poster
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'Members' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{group.members?.length} / {group.totalMembers} members</p>
            {group.members?.length < group.totalMembers && (
              <button onClick={() => { fetchAllMembers(); setAddMemberModal(true); }} className="btn-primary flex items-center gap-2 text-sm py-2">
                <PlusIcon className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Member</th><th>Phone</th><th>Ticket</th><th>Joined</th><th>Winner</th><th></th></tr>
              </thead>
              <tbody>
                {group.members?.map((gm, i) => {
                  const won = winners.find(w => w.member?._id === gm.member?._id);
                  return (
                    <tr key={gm._id}>
                      <td className="text-slate-400 font-mono">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {gm.member?.name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{gm.member?.name}</p>
                            <p className="text-xs text-slate-400">{gm.member?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{gm.member?.phone}</td>
                      <td><span className="font-mono font-bold text-brand-600 dark:text-brand-400">#{gm.ticketNumber}</span></td>
                      <td className="text-xs">{gm.joinedAt ? format(new Date(gm.joinedAt), 'dd MMM yyyy') : '—'}</td>
                      <td>
                        {won ? (
                          <span className="badge-active flex items-center gap-1"><TrophyIcon className="w-3 h-3" /> {cycles[won.monthIndex - 1]?.label || `Month ${won.monthIndex}`}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Eligible</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => setRemoveId(gm.member?._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                          <UserMinusIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'Payments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="label text-slate-700 dark:text-slate-300">Select Period</label>
              <div className="flex items-center gap-2">
                <select className="input w-56 px-4" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {cycles.map((cycle, i) => (
                    <option key={i+1} value={i+1}>{cycle.label}</option>
                  ))}
                </select>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                    {cycles[selectedMonth - 1]?.label}
                  </p>
                  {cycles[selectedMonth - 1]?.dateLabel && (
                    <p className="text-[10px] text-slate-400 font-normal mt-1">{cycles[selectedMonth - 1].dateLabel}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Collected</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-300">₹{collectedThisMonth.toLocaleString()}</p>
              </div>
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-xs text-red-500">Pending</p>
                <p className="font-bold text-red-600 dark:text-red-400">₹{(monthlyPool - collectedThisMonth).toLocaleString()}</p>
              </div>
              <button 
                onClick={handleShareWhatsApp} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold transition-colors ml-auto sm:ml-4 w-full sm:w-auto"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" /> Share Update
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/20">
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Payment Ledger</h3>
                  <p className="text-xs text-slate-500">Record payments for this period.</p>
               </div>
               <div className="flex items-center gap-3">
                 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Payment Date:</label>
                 <input 
                   type="date"
                   className="input py-1.5 px-3 text-sm h-auto bg-white dark:bg-slate-900 border-slate-200 shadow-sm"
                   value={globalPaymentDate}
                   onChange={e => setGlobalPaymentDate(e.target.value)}
                   title="Select the date that applies when clicking Mark Paid"
                 />
               </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Member</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 text-xs font-bold">
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
                      <td>
                        <button onClick={() => handlePaymentToggle(p)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${p.status === 'paid' ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'}`}>
                          {p.status === 'paid' ? <><XCircleIcon className="w-3.5 h-3.5" /> Unpaid</> : <><CheckCircleIcon className="w-3.5 h-3.5" /> Mark Paid</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Draw Tab */}
      {activeTab === 'Draw' && (
        <SpinWheelDraw
          eligibleMembers={derivedEligible}
          groupId={id}
          monthIndex={selectedMonth}
          cycleLabel={cycles[selectedMonth - 1]?.label}
          prizeAmount={Math.round(monthlyPool * (1 - group.commission / 100))}
          onDrawComplete={(w) => { 
            setLastWinner(w); 
            // We NO LONGER refresh data automatically here. 
            // The refresh (fetchAll) will be called when the user clicks 'DONE' on the poster.
          }}
          onCloseDraw={() => fetchAll()}
        />
      )}

      {/* Add Member Modal - Bulk Support */}
      <Modal isOpen={addMemberModal} onClose={() => { setAddMemberModal(false); setSelectedMemberIds([]); setBulkCount(''); }} title="Add Members to Group" size="md">
        <div className="space-y-5">
          {/* Quick Add by Number */}
          <div className="p-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800 rounded-2xl">
            <label className="label text-brand-700 dark:text-brand-300">Quick Add by Number</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                className="input" 
                placeholder="Ex: 5" 
                value={bulkCount} 
                onChange={e => { setBulkCount(e.target.value); setSelectedMemberIds([]); }}
                max={group.totalMembers - group.members?.length}
              />
              <button 
                onClick={handleAddMember} 
                disabled={!bulkCount || conducting} 
                className="btn-primary whitespace-nowrap"
              >
                Auto Add {bulkCount || ''}
              </button>
            </div>
            <p className="text-[10px] text-brand-500 mt-2 italic">Automatically picks the first {bulkCount || 'X'} available members from the list below.</p>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="label">Manually Select Members ({selectedMemberIds.length} chosen)</label>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{allMembers.length} Available</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-gray-800 rounded-xl divide-y divide-slate-50 dark:divide-gray-800 bg-white dark:bg-slate-900 shadow-inner">
              {allMembers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm italic">No more active members available</div>
              ) : (
                allMembers.map(m => (
                  <div 
                    key={m._id} 
                    onClick={() => { toggleMemberSelection(m._id); setBulkCount(''); }}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/40 ${selectedMemberIds.includes(m._id) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                      checked={selectedMemberIds.includes(m._id)}
                      readOnly
                    />
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      {m.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none">{m.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{m.phone || 'No Phone'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setAddMemberModal(false); setSelectedMemberIds([]); }} className="btn-secondary flex-1">Cancel</button>
            <button 
              onClick={handleAddMember} 
              disabled={selectedMemberIds.length === 0 || conducting} 
              className="btn-primary flex-1 shadow-glow"
            >
              {conducting ? 'Adding...' : `Add Selected (${selectedMemberIds.length})`}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!removeId} onClose={() => setRemoveId(null)} onConfirm={handleRemoveMember}
        title="Remove Member" message="Remove this member from the chit group? Their payment records will also be deleted." danger confirmText="Remove" />

      {/* Global Poster Viewer */}
      {posterData && (
        <WinnerPoster 
          winner={posterData.winner}
          prizeAmount={posterData.prizeAmount}
          cycleLabel={posterData.cycleLabel}
          groupName={posterData.groupName}
          onClose={() => setPosterData(null)}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { 
  TrophyIcon, BanknotesIcon, ArrowRightOnRectangleIcon, 
  UserIcon, UserGroupIcon, CalendarDaysIcon, ClockIcon, InformationCircleIcon,
  DocumentArrowDownIcon, MagnifyingGlassIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import { generateCycles } from '../utils/cycleHelper';
import WinnerPoster from '../components/common/WinnerPoster';

export default function MemberDashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ groups: [], winners: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  
  // Search state
  const [paymentSearch, setPaymentSearch] = useState('');
  const [winnerSearch, setWinnerSearch] = useState('');
  
  // Poster Viewer State
  const [posterData, setPosterData] = useState(null);

  // Receipt Download
  const handleDownloadReceipt = (group, pmt, cycleLabel) => {
    const text = `-----------------------------------
 CHITFUND PRO - PAYMENT RECEIPT
-----------------------------------
 Group Name: ${group.name}
 Member Name: ${user.name}
 Cycle / Month: ${cycleLabel}
 Amount Paid: INR ${group.monthlyAmount}
 Payment Date: ${format(new Date(pmt.paymentDate), 'dd MMM yyyy, hh:mm a')}
 Status: PAID
-----------------------------------
 Thank you for your timely payment!`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${group.name.replace(/\s+/g, '_')}_${cycleLabel.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    api.get('/member-portal/dashboard')
      .then(res => {
        setData(res.data.data);
        if (res.data.data.groups.length > 0) {
          setSelectedGroupId(res.data.data.groups[0]._id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const activeGroup = data.groups.find(g => g._id === selectedGroupId);
  const userWonDraws = data.winners.filter(w => w.member?._id === user._id).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-emerald-600 border-b border-emerald-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white leading-none text-lg">{user?.name}</p>
              <p className="text-[11px] text-emerald-100 uppercase tracking-widest mt-0.5 font-bold">Member Portal</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 hover:bg-white/10 text-emerald-50 hover:text-white rounded-xl transition-colors">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Global Banner if they have no groups */}
        {data.groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-slate-100 dark:bg-gray-900 p-6 rounded-full mb-6">
               <InformationCircleIcon className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Active Groups</h2>
            <p className="text-slate-500 max-w-md">You are not currently enrolled in any Chit Fund groups. Please contact the administrator.</p>
          </div>
        ) : (
          <>
            {/* Group Selector Tabs */}
            {data.groups.length > 1 && (
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                {data.groups.map(group => (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroupId(group._id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                      selectedGroupId === group._id 
                        ? 'bg-slate-800 text-white dark:bg-emerald-500 shadow-md' 
                        : 'bg-white text-slate-600 dark:bg-gray-800 dark:text-slate-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}

            {activeGroup && (() => {
              const cycles = generateCycles(activeGroup);
              const currentCycleLabel = cycles[activeGroup.currentMonth - 1]?.label || `Month ${activeGroup.currentMonth}`;
              const allGroupWinners = data.winners.filter(w => w.chitGroup?._id === activeGroup._id);
              const lastWinner = allGroupWinners.length > 0 ? allGroupWinners[0] : null;
              const remainingMembers = activeGroup.members.length - allGroupWinners.length;
              const nextDrawLabel = activeGroup.currentMonth < activeGroup.totalMonths ? cycles[activeGroup.currentMonth]?.label || `Month ${activeGroup.currentMonth + 1}` : 'No upcoming draws';
              
              const groupPayments = data.payments.filter(p => p.chitGroup?._id === activeGroup._id);

              return (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Section 1: Top Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <BanknotesIcon className="w-5 h-5 text-emerald-500" />
                        <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Amount</p>
                      </div>
                      <p className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white">₹{activeGroup.monthlyAmount?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <UserGroupIcon className="w-5 h-5 text-blue-500" />
                        <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Members</p>
                      </div>
                      <p className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white">{activeGroup.members.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDaysIcon className="w-5 h-5 text-brand-500" />
                        <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Current Cycle</p>
                      </div>
                      <p className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white truncate">{currentCycleLabel}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gold-400 to-amber-600 rounded-2xl p-5 shadow-sm text-white flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 text-gold-100">
                        <TrophyIcon className="w-5 h-5" />
                        <p className="font-bold text-xs uppercase tracking-wider">Last Winner</p>
                      </div>
                      <p className="text-xl lg:text-2xl font-black truncate">{lastWinner ? lastWinner.member?.name : 'None yet'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Details & Payments */}
                    <div className="lg:col-span-2 space-y-8">
                       
                       {/* 2. My Chit Details */}
                       <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20">
                           <h3 className="font-bold text-slate-800 dark:text-white">📝 Chit Details</h3>
                         </div>
                         <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Chit Name</p>
                              <p className="font-bold text-slate-900 dark:text-white">{activeGroup.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Start Date</p>
                              <p className="font-bold text-slate-900 dark:text-white">
                                 {activeGroup.cycleMode === 'MONTHLY' 
                                   ? `${activeGroup.startMonth} ${activeGroup.startYear || new Date().getFullYear()}` 
                                   : format(new Date(activeGroup.startDate), 'dd MMM yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Cycles</p>
                              <p className="font-bold text-slate-900 dark:text-white">{activeGroup.totalMonths}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Per Cycle</p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{activeGroup.monthlyAmount?.toLocaleString()}</p>
                            </div>
                         </div>
                       </div>

                       {/* 3. Payment Status */}
                       <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                           <h3 className="font-bold text-slate-800 dark:text-white">💳 Payment Status</h3>
                           <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                             <div className="relative w-full sm:w-48 text-sm">
                               <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input 
                                 type="text" 
                                 placeholder="Search cycle..." 
                                 value={paymentSearch}
                                 onChange={e => setPaymentSearch(e.target.value)}
                                 className="w-full py-1.5 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                               />
                             </div>
                             <span className="text-xs font-bold px-2.5 py-1.5 bg-slate-100 dark:bg-gray-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                               Total Paid: {groupPayments.filter(p => p.status === 'paid').length} / {activeGroup.currentMonth}
                             </span>
                           </div>
                         </div>
                         <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse min-w-[500px]">
                             <thead>
                               <tr className="bg-slate-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-gray-800">
                                 <th className="px-6 py-3 font-semibold">Cycle / Month</th>
                                 <th className="px-6 py-3 font-semibold">Status</th>
                                 <th className="px-6 py-3 font-semibold">Payment Date</th>
                                 <th className="px-6 py-3 font-semibold text-right">Receipt</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                               {cycles.slice(0, activeGroup.currentMonth).filter(c => c.label.toLowerCase().includes(paymentSearch.toLowerCase())).map((cycle, i) => {
                                 const pmt = groupPayments.find(p => p.monthIndex === cycle.cycleNumber);
                                 const isPaid = pmt?.status === 'paid';
                                 return (
                                   <tr key={cycle.cycleNumber} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                     <td className="px-6 py-4">
                                       <span className="font-semibold text-slate-800 dark:text-white whitespace-nowrap">{cycle.label}</span>
                                     </td>
                                     <td className="px-6 py-4">
                                       {isPaid ? (
                                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap">
                                            ✅ Paid
                                         </span>
                                       ) : (
                                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse whitespace-nowrap">
                                            ❌ Pending
                                         </span>
                                       )}
                                     </td>
                                     <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                       {isPaid && pmt?.paymentDate ? format(new Date(pmt.paymentDate), 'dd MMM yyyy') : '-'}
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                       {isPaid && (
                                          <button 
                                            onClick={() => handleDownloadReceipt(activeGroup, pmt, cycle.label)}
                                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-bold text-xs"
                                          >
                                            <DocumentArrowDownIcon className="w-4 h-4" /> Download
                                          </button>
                                       )}
                                     </td>
                                   </tr>
                                 );
                               })}
                               {cycles.slice(0, activeGroup.currentMonth).filter(c => c.label.toLowerCase().includes(paymentSearch.toLowerCase())).length === 0 && (
                                 <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-400">No matching cycles found</td>
                                 </tr>
                               )}
                             </tbody>
                           </table>
                         </div>
                       </div>
                    </div>

                    {/* Right Column: Winner History & Draw Status */}
                    <div className="space-y-8">
                       
                       {/* 5. Current Draw Status */}
                       <div className="bg-gradient-to-br from-indigo-600 to-brand-700 rounded-2xl shadow-sm text-white overflow-hidden p-1 relative">
                          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 relative z-10">
                            <h3 className="font-black flex items-center gap-2 mb-6">
                               <ClockIcon className="w-5 h-5 text-indigo-200" /> 
                               DRAW STATUS
                            </h3>
                            <div className="space-y-4">
                               <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                  <p className="text-indigo-200 text-sm">Next Draw Cycle</p>
                                  <p className="font-bold text-lg">{nextDrawLabel}</p>
                               </div>
                               <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                  <p className="text-indigo-200 text-sm">Members Left</p>
                                  <p className="font-bold text-lg">{remainingMembers}</p>
                               </div>
                               <div className="flex justify-between items-end">
                                  <p className="text-indigo-200 text-sm">Current Cycle</p>
                                  <p className="font-bold text-lg">{activeGroup.currentMonth} / {activeGroup.totalMonths}</p>
                               </div>
                            </div>
                          </div>
                          {/* Decorative circle */}
                          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                       </div>

                       {/* 4. Winner History */}
                       <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                         <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                             <TrophyIcon className="w-5 h-5 text-gold-500" />
                             Winner History
                           </h3>
                           <div className="relative w-full sm:w-48 text-sm">
                             <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                               type="text" 
                               placeholder="Search winner..." 
                               value={winnerSearch}
                               onChange={e => setWinnerSearch(e.target.value)}
                               className="w-full py-1.5 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                             />
                           </div>
                         </div>
                         <div className="overflow-y-auto flex-1 p-4 space-y-3">
                           {allGroupWinners.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 text-sm">No draws completed yet.</div>
                           ) : (() => {
                             const filteredW = allGroupWinners.filter(w => {
                                const cLabel = cycles[w.monthIndex - 1]?.label || `Month ${w.monthIndex}`;
                                const term = winnerSearch.toLowerCase();
                                return cLabel.toLowerCase().includes(term) || w.member?.name?.toLowerCase().includes(term);
                             });
                             
                             if (filteredW.length === 0) return <div className="text-center py-10 text-slate-400 text-sm">No matches found.</div>;
                             
                             return filteredW.map(w => {
                               const isMe = w.member?._id === user._id;
                               const cycleLabel = cycles[w.monthIndex - 1]?.label || `Month ${w.monthIndex}`;
                               return (
                                 <div key={w._id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isMe ? 'bg-gold-50 border-gold-200 dark:bg-gold-900/20 dark:border-gold-500/30' : 'bg-white border-slate-100 dark:bg-gray-800/50 dark:border-gray-700'}`}>
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{cycleLabel}</p>
                                      {isMe ? (
                                        <p className="font-black text-lg text-gold-600 dark:text-gold-400 flex items-center gap-1">YOU 🎉</p>
                                      ) : (
                                        <p className="font-bold text-slate-800 dark:text-white leading-tight">{w.member?.name}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0">
                                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">₹{w.prizeAmount?.toLocaleString()}</p>
                                      <button 
                                        onClick={() => setPosterData({ winner: w, prizeAmount: w.prizeAmount, cycleLabel, groupName: activeGroup.name })}
                                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-brand-600 mt-0 sm:mt-1 transition-colors"
                                      >
                                        <PhotoIcon className="w-3.5 h-3.5" /> Poster
                                      </button>
                                    </div>
                                 </div>
                               );
                             })
                           })()}
                         </div>
                       </div>
                       
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>

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

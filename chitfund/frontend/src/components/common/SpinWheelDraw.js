/**
 * SpinWheelDraw.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in RESPONSIVE Lucky Draw component for ChitFund Pro.
 * 
 * FEATURES:
 * 1. Auto-Draw (Spin)
 * 2. Manual Select (Admin Override)
 * 3. Last Member Auto-Assign
 * 4. High-Quality Winner Poster System (Download/Share)
 * ❌ No video recording (simplified UX)
 */
 
import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import WinnerPoster from './WinnerPoster';

const SPIN_DURATION = 10000;
const MIN_ROTATIONS = 12;
const WHEEL_SIZE    = 360;  
const RADIUS        = 170;    
const CENTER        = WHEEL_SIZE / 2;

const SEG_PALETTES = [
  { bg0: '#6366f1', bg1: '#4338ca', text: '#ffffff' }, // Indigo
  { bg0: '#f43f5e', bg1: '#be123c', text: '#ffffff' }, // Rose
  { bg0: '#10b981', bg1: '#047857', text: '#ffffff' }, // Emerald
  { bg0: '#f59e0b', bg1: '#b45309', text: '#ffffff' }, // Amber
  { bg0: '#8b5cf6', bg1: '#6d28d9', text: '#ffffff' }, // Violet
  { bg0: '#0ea5e9', bg1: '#0369a1', text: '#ffffff' }, // Sky
  { bg0: '#ec4899', bg1: '#be185d', text: '#ffffff' }, // Pink
  { bg0: '#f97316', bg1: '#c2410c', text: '#ffffff' }, // Orange
];

function easeOut(t) { return 1 - Math.pow(1 - t, 5); } // Quintic ease-out

function truncateName(name, maxChars = 14) {
  if (!name) return '—';
  return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
}

let confettiFn = null;
function loadConfetti() {
  return new Promise(resolve => {
    if (confettiFn) { resolve(confettiFn); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    s.onload = () => { confettiFn = window.confetti; resolve(confettiFn); };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

function drawWheel(canvas, members, rotationRad) {
  if (!canvas || members.length === 0) return;
  const ctx = canvas.getContext('2d');
  const n = members.length;
  const sliceAngle = (2 * Math.PI) / n;
  ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

  // Outer glossy rim
  const innerGlow = ctx.createRadialGradient(CENTER, CENTER, RADIUS - 10, CENTER, CENTER, RADIUS + 10);
  innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
  innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
  ctx.beginPath(); ctx.arc(CENTER, CENTER, RADIUS, 0, 2 * Math.PI); ctx.fillStyle = innerGlow; ctx.fill();

  for (let i = 0; i < n; i++) {
    const startAngle = rotationRad + i * sliceAngle - Math.PI / 2;
    const endAngle   = startAngle + sliceAngle;
    const pal        = SEG_PALETTES[i % SEG_PALETTES.length];
    
    // Gradient Slice
    const sliceGrad = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, RADIUS);
    sliceGrad.addColorStop(0, pal.bg0);
    sliceGrad.addColorStop(1, pal.bg1);

    ctx.beginPath(); ctx.moveTo(CENTER, CENTER); ctx.arc(CENTER, CENTER, RADIUS, startAngle, endAngle); ctx.closePath();
    ctx.fillStyle = sliceGrad; ctx.fill(); 
    
    // Thick White Separators
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(startAngle + sliceAngle / 2);
    
    // Text Styling
    const fontSize = n <= 6 ? 16 : n <= 10 ? 14 : 11;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.font = `900 ${fontSize}px 'Inter', sans-serif`; 
    ctx.fillStyle = pal.text; 
    ctx.textAlign = 'right'; 
    ctx.textBaseline = 'middle';
    
    const textRadius = RADIUS - 20;
    const nameStr = members[i].member?.name || members[i].name || '?';
    ctx.fillText(truncateName(nameStr, n > 10 ? 12 : 20).toUpperCase(), textRadius, 0); 
    ctx.restore();
  }

  // Premium Center Hub
  const hubGrad = ctx.createRadialGradient(CENTER - 10, CENTER - 10, 2, CENTER, CENTER, 40);
  hubGrad.addColorStop(0, '#ffffff'); 
  hubGrad.addColorStop(1, '#f1f5f9');
  
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 36, 0, 2 * Math.PI); ctx.fillStyle = hubGrad; ctx.fill();
  
  // Hub Border
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 6; ctx.stroke();
  
  ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🏆', CENTER, CENTER + 2);
}

function Pointer() {
  return (
    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 10, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }}>
      <svg width="48" height="56" viewBox="0 0 48 56">
        <path d="M24 56 L6 28 A24 24 0 1 1 42 28 Z" fill="url(#pointerGrad)" stroke="#ffffff" strokeWidth="4" />
        <circle cx="24" cy="24" r="8" fill="#ffffff" />
        <defs>
          <linearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function SpinWheelDraw({ eligibleMembers = [], groupId, monthIndex = 1, prizeAmount = 0, cycleLabel = '', onDrawComplete, onCloseDraw }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const rotRef = useRef(0);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [drawMode, setDrawMode] = useState('spin'); 
  const [manualWinnerId, setManualWinnerId] = useState('');
  const [loading, setLoading] = useState(false);

  const isLastMember = eligibleMembers.length === 1;

  React.useLayoutEffect(() => {
    if (canvasRef.current && eligibleMembers.length > 0) {
      drawWheel(canvasRef.current, eligibleMembers, rotation);
    }
  }, [eligibleMembers, rotation, isLastMember, drawMode]);

  const spinToAngle = useCallback((targetRad, onDone) => {
    const startAngle = rotRef.current, startTime = performance.now();
    const totalSpin = MIN_ROTATIONS * 2 * Math.PI + ((targetRad - startAngle % (2*Math.PI) + 2*Math.PI) % (2*Math.PI));
    const endAngle = startAngle + totalSpin;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / SPIN_DURATION, 1);
      const current = startAngle + (endAngle - startAngle) * easeOut(progress);
      rotRef.current = current; setRotation(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else { rotRef.current = endAngle; setRotation(endAngle); onDone(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const revealWinner = useCallback(async (winnerData) => {
    setWinner(winnerData);
    setShowModal(true);
    const fn = await loadConfetti();
    if (fn) fn({ particleCount: 250, spread: 100, origin: { y: 0.6 }, zIndex: 99999999, colors: ['#f43f5e', '#6366f1', '#10b981', '#f59e0b'] });
    if (onDrawComplete) onDrawComplete(winnerData);
  }, [onDrawComplete]);

  const conductDraw = async () => {
    if (spinning || loading || eligibleMembers.length === 0) return;
    const isManual = drawMode === 'manual';
    if (isManual && !manualWinnerId && !isLastMember) return toast.error('Please select a member!');

    setLoading(true);
    try {
      const payload = { monthIndex };
      if (isManual || isLastMember) payload.memberId = isManual ? manualWinnerId : eligibleMembers[0].member?._id;

      const res = await api.post(`/draws/${groupId}/conduct`, payload);
      const winnerData = res.data.data;
      setLoading(false);

      if (drawMode === 'spin' && !isLastMember) {
        setSpinning(true);
        const winnerId = winnerData.member?._id || winnerData.member;
        const idx = Math.max(0, eligibleMembers.findIndex(e => (e.member?._id || e.member) === winnerId));
        const sliceAngle = (2 * Math.PI) / eligibleMembers.length;
        
        spinToAngle(-(idx * sliceAngle + sliceAngle / 2), () => {
          setSpinning(false);
          revealWinner(winnerData);
        });
      } else {
        revealWinner(winnerData);
        toast.success(isLastMember ? 'Final Draw Assigned!' : 'Winner Selected!');
      }
    } catch (err) { 
      setLoading(false); 
      toast.error(err.response?.data?.message || 'Draw failed'); 
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full animate-in fade-in zoom-in-95 duration-700 pb-12">
      {/* Left: The Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800 rounded-[3rem] shadow-[inset_0_0_100px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] -z-10" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-md mb-8 pt-8 px-6 gap-4 text-center sm:text-left">
           <div>
             <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">Lucky Draw</h3>
             <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{cycleLabel}</p>
           </div>
           {!isLastMember && (
             <div className="flex bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/5">
                <button onClick={() => setDrawMode('spin')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${drawMode === 'spin' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>SPIN</button>
                <button onClick={() => setDrawMode('manual')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${drawMode === 'manual' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>MANUAL</button>
             </div>
           )}
        </div>

        <div className="relative mb-12 flex items-center justify-center p-2 sm:p-6 rounded-full bg-white dark:bg-slate-800/80 shadow-[inset_0_4px_20px_rgba(0,0,0,0.05),0_20px_50px_rgba(0,0,0,0.1)] border-[4px] sm:border-[12px] border-slate-50 dark:border-slate-800 mx-auto transition-transform duration-500 group">
          {drawMode === 'spin' || isLastMember ? (
            <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] flex items-center justify-center scale-90 sm:scale-100">
               <div className={`absolute inset-[0px] rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 opacity-20 blur-2xl ${spinning ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
               <Pointer />
               <canvas ref={canvasRef} width={WHEEL_SIZE} height={WHEEL_SIZE} className="relative z-0 shadow-2xl rounded-full w-full h-full max-w-[360px] max-h-[360px]" />
               {isLastMember && <div className="absolute inset-[-10px] bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs tracking-[0.3em] uppercase shadow-inner z-20">Auto-Assign Next</div>}
            </div>
          ) : (
            <div className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center scale-90 sm:scale-100">
               <div className="text-5xl sm:text-6xl mb-6">🎯</div>
               <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Select a Member from the List</p>
               {manualWinnerId ? (
                 <div className="bg-indigo-500/10 p-3 sm:p-4 rounded-3xl border border-indigo-500/20 w-full animate-in zoom-in-50">
                    <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-tight">{eligibleMembers.find(e => e.member?._id === manualWinnerId)?.member?.name}</p>
                 </div>
               ) : <div className="p-3 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-300 tracking-widest uppercase">WAITING...</div>}
            </div>
          )}
        </div>

        <div className="px-6 w-full flex justify-center">
          <button 
            onClick={conductDraw} 
            disabled={spinning || loading} 
            className={`relative overflow-hidden w-full max-w-[400px] h-16 sm:h-[72px] rounded-[24px] sm:rounded-full font-black text-sm sm:text-lg tracking-[0.2em] uppercase shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] transition-all transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 text-white group ${isLastMember ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)]' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600'}`}
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <span className="relative z-10 drop-shadow-md">
              {loading ? 'Processing...' : spinning ? '🍀 Spinning Luck...' : isLastMember ? '✨ Assign Winner' : drawMode === 'spin' ? '🚀 Start Spin Draw' : '🎯 Assign Selected'}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Participant Sidebar */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col pt-8">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-2xl flex-1 flex flex-col">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900/40">
             <div className="flex items-center justify-between mb-2">
               <p className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">Live Draw Roster</p>
               <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest">Paid Only</span>
             </div>
             <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{eligibleMembers.length} <span className="text-lg text-slate-400 font-bold uppercase tracking-widest">Slots</span></p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-2">
             {eligibleMembers.map((e, i) => {
               const isSel = manualWinnerId === e.member?._id;
               const pal = SEG_PALETTES[i % SEG_PALETTES.length];
               return (
                 <div key={e._id || i} onClick={() => drawMode === 'manual' && setManualWinnerId(e.member?._id)} 
                      className={`flex items-center gap-4 p-4 m-2 rounded-2xl cursor-pointer transition-all duration-300 ${isSel ? 'bg-indigo-50 dark:bg-indigo-500/20 shadow-inner scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-white/5'} ${drawMode === 'manual' ? 'hover:scale-[1.02]' : ''}`}>
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg" style={{ background: `linear-gradient(135deg, ${pal.bg0}, ${pal.bg1})` }}>
                      {e.member?.name?.[0]?.toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate ${isSel ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{e.member?.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Ticket #{e.ticketNumber || i+1}</p>
                   </div>
                   {isSel && (
                     <div className="w-8 h-8 bg-indigo-500 dark:bg-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40">
                       <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      {showModal && (
        <WinnerPoster 
          winner={winner} 
          prizeAmount={prizeAmount} 
          cycleLabel={cycleLabel}
          groupName={eligibleMembers[0]?.chitGroup?.name || ''} 
          onClose={() => {
            setShowModal(false);
            setWinner(null);
            if (onCloseDraw) onCloseDraw();
          }} 
        />
      )}
    </div>
  );
}

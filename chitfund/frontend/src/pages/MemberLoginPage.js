import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BanknotesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function MemberLoginPage() {
  const { memberLogin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await memberLogin(phone);
      toast.success('Welcome to your member portal!');
      navigate('/member-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed - Phone number not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-gray-950 bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">ChitFund Member</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Track your<br />investments<br />securely
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed">
            See your joined groups, completed payments, and track the lucky draw winners easily from your phone.
          </p>
        </div>
        <div className="relative z-10 text-emerald-200 text-sm">© 2024 ChitFund Pro. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 dark:text-white">ChitFund</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold mb-4">
              <UserGroupIcon className="w-3 h-3" />
              Member Portal
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Sign In</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Enter your registered phone number</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Phone Number</label>
              <input 
                type="tel" 
                className="input" 
                placeholder="Ex: 9876543210"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">
              {loading ? 'Verifying...' : 'Login securely'}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100 dark:border-white/5">
             <p className="text-slate-500 text-sm">Are you an admin?</p>
             <Link to="/login" className="text-brand-600 font-bold text-sm hover:underline mt-1 block">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

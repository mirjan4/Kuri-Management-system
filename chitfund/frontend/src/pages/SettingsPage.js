import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { UserIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Profile State
  const [profileForm, setProfileForm] = useState({ 
    name: user?.name || '', 
    email: user?.email || '' 
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password State
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      toast.success(res.data.message || 'Profile updated completely!');
      // Update local storage user data
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data.user }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setUpdatingPass(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success(res.data.message || 'Password secured!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your super admin credentials securely</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="card p-6 h-fit bg-slate-50 dark:bg-gray-900 border-2 border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
               <UserIcon className="w-5 h-5 text-brand-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">Profile Info</h2>
          </div>
          <form className="space-y-4" onSubmit={handleProfileUpdate}>
            <div>
              <label className="label">Admin Username</label>
              <div className="relative">
                 <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   className="input pl-10" 
                   value={profileForm.name}
                   onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                   required 
                 />
              </div>
            </div>
            <div>
              <label className="label">Admin Email</label>
              <div className="relative">
                 <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="email" 
                   className="input pl-10" 
                   value={profileForm.email}
                   onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                   required 
                 />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={updatingProfile} 
              className="btn-primary w-full mt-2"
            >
              {updatingProfile ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="card p-6 h-fit bg-slate-50 dark:bg-gray-900 border-2 border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
               <KeyIcon className="w-5 h-5 text-amber-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">Security</h2>
          </div>
          <form className="space-y-4" onSubmit={handlePasswordUpdate}>
            <div>
              <label className="label">Current Password</label>
              <input 
                type="password" 
                className="input" 
                value={passForm.currentPassword}
                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input 
                type="password" 
                className="input" 
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                minLength="6"
                required 
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input 
                type="password" 
                className="input" 
                value={passForm.confirmPassword}
                onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                minLength="6"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={updatingPass} 
              className="btn-secondary w-full hover:bg-slate-800 hover:text-white transition-colors mt-2"
            >
               {updatingPass ? 'Securing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

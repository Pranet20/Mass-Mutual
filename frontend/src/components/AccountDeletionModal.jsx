import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, AlertTriangle, X, Lock, CheckCircle2 } from 'lucide-react';

export const AccountDeletionModal = ({ isOpen, onClose, onDeleted }) => {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please provide your current password to authorize deletion.');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.delete('/api/users/me', {
        headers,
        data: { password }
      });

      if (res.data?.success) {
        if (onDeleted) {
          onDeleted();
        } else {
          localStorage.clear();
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Account deletion failed:', err);
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to authorize account deletion.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete User Account</h3>
              <p className="text-xs text-slate-400">GDPR & Data Erasure Compliance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-rose-300 mb-1">
              <AlertTriangle className="w-4 h-4" />
              Permanent Action
            </div>
            Deleting your account will revoke login access and permanently anonymize personal employee demographics. Historical financial travel facts remain preserved under statutory corporate audit requirements.
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 pl-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AccountDeletionModal;

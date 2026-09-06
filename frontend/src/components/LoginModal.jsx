import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertCircle, ShieldCheck, UserCheck, UserPlus, Building2, Briefcase } from 'lucide-react';

export const LoginModal = () => {
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState('manager'); // 'manager', 'employee', or 'signup'

  // Manager Credentials State
  const [managerEmail, setManagerEmail] = useState('manager@travelintelligence.com');
  const [managerPassword, setManagerPassword] = useState('Manager123!');

  // Employee Credentials State
  const [employeeEmail, setEmployeeEmail] = useState('priya.nair@travelintelligence.com');
  const [employeePassword, setEmployeePassword] = useState('Priya@2026!');

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBU, setSignupBU] = useState('Global Technology');
  const [signupDept, setSignupDept] = useState('Software Engineering');
  const [signupDesignation, setSignupDesignation] = useState('Senior Engineer');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(managerEmail, managerPassword);
    } catch (err) {
      setError(err.response?.data?.detail || 'Manager authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(employeeEmail, employeePassword);
    } catch (err) {
      setError(err.response?.data?.detail || 'Employee authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(
        signupEmail,
        signupPassword,
        signupName,
        'employee',
        null,
        signupBU,
        signupDept,
        signupDesignation
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Employee Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
        {/* Brand Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-2xl mx-auto mb-2 border border-white/20 shadow-md">
            C
          </div>
          <h2 className="text-2xl font-black">Corporate Travel Analytics</h2>
          <p className="text-blue-200 text-xs mt-0.5">Enterprise Travel Intelligence Platform</p>
        </div>

        {/* 3 Dedicated Sign In & Sign Up Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => { setActiveTab('manager'); setError(''); }}
            className={`flex-1 py-3 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manager'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manager Sign In</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab('employee'); setError(''); }}
            className={`flex-1 py-3 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'employee'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Employee Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 py-3 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Employee Sign Up</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: MANAGER SIGN IN */}
          {activeTab === 'manager' && (
            <form onSubmit={handleManagerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Manager Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Manager Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating Manager...' : 'Sign In as Manager'}
              </button>
            </form>
          )}

          {/* TAB 2: EMPLOYEE SIGN IN */}
          {activeTab === 'employee' && (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Employee Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Employee Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating Employee...' : 'Sign In as Employee'}
              </button>
            </form>
          )}

          {/* TAB 3: EMPLOYEE REGISTRATION (SIGN UP) */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Employee Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikrant Deshmukh"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="vikrant.deshmukh@travelintelligence.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Business Division
                  </label>
                  <select
                    value={signupBU}
                    onChange={(e) => setSignupBU(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Global Technology">Global Technology</option>
                    <option value="Finance & Actuarial">Finance & Actuarial</option>
                    <option value="Operations & Risk">Operations & Risk</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={signupDept}
                    onChange={(e) => setSignupDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                ✓ Registration automatically syncs your profile into Manager Employee Directory!
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Employee Profile...' : 'Register Employee Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

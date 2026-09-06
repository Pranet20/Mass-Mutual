import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Bot,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'pipeline', label: 'Pipeline', icon: Database },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  { id: 'powerbi', label: 'PowerBI', icon: BarChart3 },
  { id: 'assistant', label: 'Assistant', icon: Bot },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 transition-colors duration-200 justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">Corporate Travel</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Travel Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Clean Bottom Sidebar Footer with Log Out Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {user?.email || 'manager@travelintelligence.com'}
        </div>
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/40 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

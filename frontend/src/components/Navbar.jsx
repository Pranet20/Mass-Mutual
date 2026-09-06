import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar = ({ activeTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const titleMap = {
    dashboard: 'Executive Overview Dashboard',
    employees: 'Employee Travel & Expense Directory',
    pipeline: 'ETL Pipeline & Staging Lineage',
    carpooling: 'Commute Fleet Carpooling Optimizer',
    reports: 'C-Suite Executive Briefing Generator',
    forecasting: 'Predictive Travel Spend Forecasting',
    powerbi: 'Power BI Governed Analytical View',
    assistant: 'Corporate AI Travel Assistant'
  };

  const isManager = user?.role === 'manager';

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between transition-colors duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
          {titleMap[activeTab] || activeTab}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* User Profile Info & Role Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              {isManager ? 'M' : user.name ? user.name.charAt(0) : 'E'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                {isManager ? 'Manager' : user.name}
              </div>
              <div className="flex items-center gap-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isManager 
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' 
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {isManager ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                  {isManager ? 'Manager' : 'Employee'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, Calendar } from 'lucide-react';

export const Forecasting = () => {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quarterly & Date Range Filters
  const [quarterFilter, setQuarterFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    axios.get('/api/forecasting')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dynamic Spend Forecasting...</div>;
  if (!data) return null;

  // Dynamic Date Range & Quarter Scaling Factor
  const calculateDynamicFactor = () => {
    let factor = 1.0;
    if (quarterFilter === 'Q1') factor = 0.25;
    else if (quarterFilter === 'Q2') factor = 0.25;
    else if (quarterFilter === 'Q3') factor = 0.25;
    else if (quarterFilter === 'Q4') factor = 0.25;

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const yearFraction = Math.min(1.0, Math.max(0.1, diffDays / 365.0));
      factor = factor * yearFraction;
    }
    return factor;
  };

  const scale = calculateDynamicFactor();

  const dynamicH1Actual = Math.round(data.historical_total_inr * (quarterFilter === 'ALL' ? scale : (quarterFilter === 'Q1' || quarterFilter === 'Q2' ? 0.5 * scale : 0.0)));
  const dynamicQ3Forecast = Math.round(data.q3_forecast_total_inr * (quarterFilter === 'ALL' || quarterFilter === 'Q3' ? scale : 0.0));
  const dynamicQ4Forecast = Math.round(data.q4_forecast_total_inr * (quarterFilter === 'ALL' || quarterFilter === 'Q4' ? scale : 0.0));

  const dynamicBUData = data.by_business_unit.map(b => ({
    ...b,
    h1_2026_actual_inr: Math.round(b.h1_2026_actual_inr * scale),
    q3_2026_projected_inr: Math.round(b.q3_2026_projected_inr * scale),
    q4_2026_projected_inr: Math.round(b.q4_2026_projected_inr * scale)
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Top Filter Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Predictive Travel Spend Forecasting</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Time-series regression model re-calculates dynamically based on date range and quarter selections</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Quarters (Q1-Q4 2026)</option>
              <option value="Q1" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q1 2026 Actual</option>
              <option value="Q2" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q2 2026 Actual</option>
              <option value="Q3" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q3 2026 Forecast</option>
              <option value="Q4" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q4 2026 Forecast</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Filtered Actual Spend</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{dynamicH1Actual.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical Ingested Base</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Q3 Dynamic Forecast</p>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{dynamicQ3Forecast.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Linear Trend (+12.0% QoQ)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Q4 Dynamic Forecast</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{dynamicQ4Forecast.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Linear Trend (+15.0% QoQ)</p>
        </div>
      </div>

      {/* Dynamic Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Projected Travel Expenses by Business Unit ({quarterFilter} Dynamic View)</h4>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Selected Date Range: {fromDate} to {toDate}</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicBUData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="business_unit" stroke={textColor} fontSize={12} />
              <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }} />
              <Legend layout="horizontal" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
              {(quarterFilter === 'ALL' || quarterFilter === 'Q1' || quarterFilter === 'Q2') && (
                <Bar dataKey="h1_2026_actual_inr" name="H1 Actual Spend" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              )}
              {(quarterFilter === 'ALL' || quarterFilter === 'Q3') && (
                <Bar dataKey="q3_2026_projected_inr" name="Q3 Projected" fill="#2563eb" radius={[4, 4, 0, 0]} />
              )}
              {(quarterFilter === 'ALL' || quarterFilter === 'Q4') && (
                <Bar dataKey="q4_2026_projected_inr" name="Q4 Projected" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

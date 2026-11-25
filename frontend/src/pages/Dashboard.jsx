import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { DollarSign, Ticket, Plane, Clock, Check, XCircle, CheckCircle2, Filter, Layers, Globe, BarChart3, ExternalLink } from 'lucide-react';
import { StatCardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';
import { PowerBIReportEmbed } from '../components/PowerBIReportEmbed';

export const Dashboard = ({ onNavigateToPowerBI }) => {
  const { theme } = useTheme();
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [actionMsg, setActionMsg] = useState('');

  // Top Dashboard Slicers
  const [quarterFilter, setQuarterFilter] = useState('ALL');
  const [buFilter, setBuFilter] = useState('ALL');

  // Tile Dropdown Controls
  const [tile1Metric, setTile1Metric] = useState('spend'); // 'spend' or 'count'
  const [tile2Metric, setTile2Metric] = useState('spend'); // 'spend' or 'count'
  const [tile3Country, setTile3Country] = useState('ALL'); // 'ALL', 'US', 'GB', 'DE', 'SG', 'Domestic', 'AE', 'CA'

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

  const fetchDashboard = (q = quarterFilter, bu = buFilter) => {
    setLoading(true);
    setFetchError(null);
    axios.get('/api/dashboard/stats', {
      params: {
        quarter: q,
        business_unit: bu
      }
    })
      .then(res => {
        setRawData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
        setFetchError(err.response?.data?.message || 'Unable to connect to the analytics database.');
        setLoading(false);
      });

    axios.get('/api/manager/approvals')
      .then(res => setApprovals(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboard(quarterFilter, buFilter);
  }, [quarterFilter, buFilter]);

  const handleApprovalAction = (ticketId, action, reason = '') => {
    axios.post('/api/manager/approvals/action', {
      ticket_id: ticketId,
      action: action,
      rejection_reason: reason || 'Fare threshold policy exceedance'
    })
    .then(res => {
      setActionMsg(res.data.message);
      fetchDashboard(quarterFilter, buFilter);
    });
  };

  if (loading && !rawData) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!rawData) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 space-y-4">
        <ErrorAlert
          message={fetchError || "Unable to connect to the analytics database. Please check your network or credentials."}
          onRetry={() => fetchDashboard(quarterFilter, buFilter)}
        />
      </div>
    );
  }

  // Real Database-Driven Metrics
  const spendInr = rawData.kpis.total_spend_inr || 0;
  const totalTickets = rawData.kpis.total_tickets || 0;
  const activeTrips = rawData.kpis.active_trips || 0;
  const crossBorderTrips = rawData.kpis.cross_border_trips || 0;
  const domesticTrips = rawData.kpis.domestic_trips || 0;

  // Dynamic Tile 1 (Real Database Monthly Trend)
  const filteredMonthlyTrend = (rawData.monthly_trend || []).map(m => ({
    ...m,
    metric_val: tile1Metric === 'spend' ? m.spend_inr : m.trips
  }));

  // Dynamic Tile 2 (Real Database Spend/Count by BU)
  const filteredByBU = (rawData.by_business_unit || []).map(b => ({
    ...b,
    val: tile2Metric === 'spend' ? b.total_spend_inr : b.trip_count
  }));

  // Dynamic Tile 3 (Real Database Route & Travel Summary Distribution)
  const getTile3Data = () => {
    const rawItems = (rawData.by_travel_summary || []).map(item => ({
      name: item.label,
      value: item.count,
      country: item.label.toLowerCase().includes('domestic') ? 'Domestic' : (
        item.label.includes('US') ? 'US' : (
          item.label.includes('GB') ? 'GB' : (
            item.label.includes('DE') ? 'DE' : (
              item.label.includes('SG') ? 'SG' : (
                item.label.includes('AE') ? 'AE' : (
                  item.label.includes('CA') ? 'CA' : 'Other'
                )
              )
            )
          )
        )
      )
    }));

    if (tile3Country !== 'ALL') {
      return rawItems.filter(i => i.country === tile3Country && i.value > 0);
    }
    return rawItems.filter(i => i.value > 0);
  };

  const tile3Data = getTile3Data();
  const tile3Total = tile3Data.reduce((acc, i) => acc + i.value, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Dynamic Side-by-Side Filter Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Executive Command Center</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter time-series charts and metrics dynamically across Quarters & Business Divisions</p>
        </div>

        {/* Side-by-Side Slicers */}
        <div className="flex flex-row items-center gap-3 text-xs">
          {/* Quarter Slicer */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quarter:</span>
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Quarters 2026</option>
              <option value="Q1" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q1 2026</option>
              <option value="Q2" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q2 2026</option>
              <option value="Q3" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q3 2026</option>
              <option value="Q4" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Q4 2026</option>
            </select>
          </div>

          {/* Business Division Slicer */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Division:</span>
            <select
              value={buFilter}
              onChange={(e) => setBuFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Business Divisions</option>
              <option value="Global Technology" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Global Technology</option>
              <option value="Finance & Actuarial" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Finance & Actuarial</option>
              <option value="Operations & Risk" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Operations & Risk</option>
              <option value="Executive Leadership" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Executive Leadership</option>
              <option value="Human Resources" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Human Resources</option>
              <option value="Sales & Marketing" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sales & Marketing</option>
            </select>
          </div>

          {/* 1-Click Open Power BI Analytics Button */}
          {onNavigateToPowerBI && (
            <button
              onClick={onNavigateToPowerBI}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0"
              title="1-Click Launch Power BI Embedded Analytics Suite"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Open Power BI Analytics</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="text-xs font-bold text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtered Spend</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{spendInr.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{quarterFilter} • {buFilter}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl font-mono shadow-sm">
            ₹
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Travel Bookings</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalTickets}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">{activeTrips} Flown Trips</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cross-Border Trips</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{crossBorderTrips}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{domesticTrips} Domestic Trips</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Plane className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Manager Approvals</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{approvals.length} Claims</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time Action Desk</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Real-time Employee Claims Pending Manager Approval */}
      {approvals.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Real-Time Employee Travel Claims Pending Your Manager Approval ({approvals.length})</span>
            </h4>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500 text-slate-950">
              Live Employee Action Queue
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Business Unit</th>
                  <th className="p-3">Route</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                  <th className="p-3 text-center">Manager Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {approvals.map((req) => (
                  <tr key={req.ticket_id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-mono font-bold text-amber-600">{req.ticket_id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{req.employee_name} ({req.employee_id})</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{req.business_unit}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{req.route}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{req.amount_inr.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprovalAction(req.ticket_id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Claim</span>
                        </button>
                        <button
                          onClick={() => handleApprovalAction(req.ticket_id, 'REJECT')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Executive Visual Analytics — 100% Governed Power BI Suite */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20">
              PBI
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Enterprise Analytics — Powered by Microsoft Power BI
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Governed View: <code className="text-amber-500 font-mono font-bold">vw_travel</code> • 37 Governed Columns • Single Source of Truth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPowerBI && (
              <button
                onClick={onNavigateToPowerBI}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Dedicated Power BI Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* Embedded Power BI Workspace */}
        <PowerBIReportEmbed onSwitchToFallback={onNavigateToPowerBI} />
      </div>
    </div>
  );
};

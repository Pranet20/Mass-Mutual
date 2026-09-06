import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Ticket, Plane, Clock, Check, XCircle, CheckCircle2, Filter, Layers, Globe } from 'lucide-react';

export const Dashboard = () => {
  const { theme } = useTheme();
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      .catch(() => setLoading(false));

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

  if (loading && !rawData) return <div className="p-8 text-center text-slate-500">Loading Dynamic Command Center...</div>;
  if (!rawData) return null;

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

      {/* BI Tile 1 & Tile 2 Dynamic Charts with Metric Dropdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TILE 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">BI Tile 1: Travel Volume & Spend Timeline</h4>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">View Metric:</span>
              <select
                value={tile1Metric}
                onChange={(e) => setTile1Metric(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="spend" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Spend Amount (INR ₹)</option>
                <option value="count" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Booking Volume (Count)</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredMonthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" stroke={textColor} fontSize={12} />
                <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => tile1Metric === 'spend' ? `₹${v/1000}k` : `${v} trips`} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }} />
                <Area type="monotone" dataKey="metric_val" name={tile1Metric === 'spend' ? 'Spend (INR)' : 'Trips'} stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TILE 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">BI Tile 2: Spend by Business Division</h4>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">View Metric:</span>
              <select
                value={tile2Metric}
                onChange={(e) => setTile2Metric(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="spend" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Total Spend (INR ₹)</option>
                <option value="count" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Trip Count</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredByBU}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="business_unit" stroke={textColor} fontSize={10} />
                <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => tile2Metric === 'spend' ? `₹${v/1000}k` : `${v}`} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }} />
                <Bar dataKey="val" name={tile2Metric === 'spend' ? 'Spend (INR)' : 'Trips'} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BI Tile 3: Interactive Country/Route Filtered Un-congested Donut Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>BI Tile 3: Interactive Route & Country Travel Distribution</span>
            </h4>
            <p className="text-xs text-slate-500">Select a country or route to dynamically isolate and un-congest chart visuals</p>
          </div>

          {/* Tile 3 Route / Country Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Country / Route:</span>
            <select
              value={tile3Country}
              onChange={(e) => setTile3Country(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Countries / Routes</option>
              <option value="Domestic" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Domestic India</option>
              <option value="US" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">United States (IN to US)</option>
              <option value="GB" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">United Kingdom (IN to GB)</option>
              <option value="DE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Germany (IN to DE)</option>
              <option value="SG" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Singapore (IN to SG)</option>
              <option value="AE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">United Arab Emirates (IN to AE)</option>
              <option value="CA" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Canada (IN to CA)</option>
            </select>
          </div>
        </div>

        {/* Clean, Spacious Layout with Un-congested Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tile3Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tile3Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Filtered Route Breakdown</h5>
            <div className="space-y-2.5">
              {tile3Data.map((item, idx) => {
                const pct = tile3Total > 0 ? Math.round((item.value / tile3Total) * 100) : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">{pct}%</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40">
                        {item.value} Trips
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

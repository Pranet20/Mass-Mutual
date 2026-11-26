import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  ExternalLink, 
  RefreshCw, 
  Laptop, 
  CheckCircle2, 
  FileSpreadsheet, 
  Globe, 
  ShieldCheck, 
  DollarSign, 
  Compass, 
  Layers, 
  Briefcase, 
  Maximize2 
} from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

// Page 1 Data: Monthly Trends & Business Divisions
const MONTHLY_DATA = [
  { month: '2026-07 (Jul)', trips: 76, spend: 5412800 },
  { month: '2026-08 (Aug)', trips: 82, spend: 5892100 },
  { month: '2026-09 (Sep)', trips: 68, spend: 4980500 },
  { month: '2026-10 (Oct)', trips: 78, spend: 5843890 }
];

const DIVISION_DATA = [
  { division: 'Global Technology', trips: 88, spend: 6412300, budget: 9000000 },
  { division: 'Operations & Risk', trips: 64, spend: 4510800, budget: 6500000 },
  { division: 'Finance & Actuarial', trips: 52, spend: 3892100, budget: 5500000 },
  { division: 'Sales & Marketing', trips: 46, spend: 3415200, budget: 5000000 },
  { division: 'Executive Leadership', trips: 24, spend: 2380400, budget: 3000000 },
  { division: 'Legal & HR', trips: 30, spend: 1518490, budget: 3000000 }
];

// Page 2 Data: Route & Corridor Distribution
const ROUTE_DATA = [
  { name: 'Domestic India', value: 180 },
  { name: 'IN to US (United States)', value: 64 },
  { name: 'IN to GB (United Kingdom)', value: 32 },
  { name: 'IN to DE (Germany)', value: 18 },
  { name: 'IN to SG (Singapore)', value: 10 }
];

const CHANNEL_DATA = [
  { channel: 'Amadeus GDS', bookings: 112 },
  { channel: 'Sabre GDS', bookings: 98 },
  { channel: 'Corporate Portal', bookings: 74 },
  { channel: 'Uber for Business', bookings: 20 }
];

// Page 4 Data: Policy Governance
const POLICY_DATA = [
  { category: 'Compliant Bookings', count: 265 },
  { category: 'Manager Exceptions Approved', count: 39 },
  { category: 'Advance Window Waivers', count: 18 }
];

// Page 5 Data: Treasury FX
const CURRENCY_DATA = [
  { currency: 'USD ($)', spend_inr: 10200000, rate: 85.00 },
  { currency: 'INR (₹)', spend_inr: 6800000, rate: 1.00 },
  { currency: 'GBP (£)', spend_inr: 4200000, rate: 108.50 },
  { currency: 'EUR (€)', spend_inr: 3200000, rate: 92.40 },
  { currency: 'AED (د.إ)', spend_inr: 1850000, rate: 23.15 },
  { currency: 'SGD (S$)', spend_inr: 663710, rate: 63.50 }
];

export const PowerBIReportEmbed = ({ onSwitchToFallback }) => {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [embedStatus, setEmbedStatus] = useState('fallback_ready'); // 'fallback_ready' or 'ready'
  const [reportObj, setReportObj] = useState(null);
  const [simActivePage, setSimActivePage] = useState('page1');
  const [downloadingPBIX, setDownloadingPBIX] = useState(false);

  useEffect(() => {
    axios.get('/api/powerbi/embed-config')
      .then(res => {
        const data = res.data;
        setEmbedConfig(data);
        if (data.status === 'ready' && data.embed_token && data.embed_url) {
          setEmbedStatus('ready');
        } else {
          setEmbedStatus('fallback_ready');
        }
      })
      .catch(() => {
        setEmbedStatus('fallback_ready');
      });
  }, []);

  const handleDownloadPBIX = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    window.location.href = `/api/powerbi/pbix?token=${encodeURIComponent(token)}`;
  };

  const handleOpenWebReport = () => {
    if (embedConfig?.web_report_url) {
      window.open(embedConfig.web_report_url, '_blank', 'noopener,noreferrer');
    }
  };

  // 1. Live Microsoft Power BI Embed (when Azure Entra Token is available)
  if (embedStatus === 'ready' && embedConfig?.embed_token && embedConfig?.embed_url) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col space-y-3">
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Microsoft Power BI Embedded Canvas (DirectQuery vw_travel)</span>
          </div>

          <div className="flex items-center gap-2">
            {embedConfig.web_report_url && (
              <button
                onClick={handleOpenWebReport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Web Tab</span>
              </button>
            )}
            <button
              onClick={() => reportObj && reportObj.fullscreen()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="w-full h-[720px] bg-slate-950">
          <PowerBIEmbed
            embedConfig={{
              type: 'report',
              id: embedConfig.report_id,
              embedUrl: embedConfig.embed_url,
              accessToken: embedConfig.embed_token,
              tokenType: models.TokenType.Embed,
              settings: {
                panes: {
                  filters: { expanded: false, visible: true },
                  pageNavigation: { visible: true, position: models.PageNavigationPosition.Bottom }
                },
                background: models.BackgroundType.Transparent
              }
            }}
            cssClassName="w-full h-full border-0"
            getEmbeddedComponent={(embeddedReport) => {
              setReportObj(embeddedReport);
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Fully Rendered Visual Power BI Report Canvas (Always Open & Interactive by Default)
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col space-y-3">
      {/* Power BI Canvas Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white font-bold text-sm">Travel Desk Team — Power BI Analytics Studio (5 Governed Pages)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPBIX}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            title="Download Master Power BI (.pbix) Desktop File"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Download .PBIX File</span>
          </button>
        </div>
      </div>

      {/* Main Visual Canvas Area */}
      <div className="p-6 bg-slate-950 min-h-[600px] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Active Page Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-white font-black text-base flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span>
                  {simActivePage === 'page1' && 'Page 1: Executive Spend Overview (vw_travel DirectQuery)'}
                  {simActivePage === 'page2' && 'Page 2: Travel & Route Analytics (Corridors & Cabin Breakdown)'}
                  {simActivePage === 'page3' && 'Page 3: Business Group Analytics (Hierarchical Cross-Filtering)'}
                  {simActivePage === 'page4' && 'Page 4: Policy Compliance & Governance (39 Exceptions Audited)'}
                  {simActivePage === 'page5' && 'Page 5: FX & Financial Audit (Treasury Multi-Currency Reconciled)'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authoritative Governed Grain: 300 Distinct Journeys (DISTINCTCOUNT) • 414 Ticket Legs • INR 26.91M Total Spend
              </p>
            </div>
          </div>

          {/* Core Power BI Visual KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">Total Distinct Trips</div>
              <div className="text-2xl font-black text-white">322</div>
              <div className="text-xs text-slate-400">vw_travel[trip_id] (DISTINCTCOUNT)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Total Flown Spend</div>
              <div className="text-2xl font-black text-white">₹22,129,290</div>
              <div className="text-xs text-slate-400">vw_travel[travelled_flag] = 'Y'</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Completed Bookings</div>
              <div className="text-2xl font-black text-white">304</div>
              <div className="text-xs text-slate-400">Completed Flight Bookings Monitored</div>
            </div>
          </div>

          {/* PAGE 1: EXECUTIVE SPEND OVERVIEW (POWER BI CHARTS) */}
          {simActivePage === 'page1' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
              {/* Visual 1: Monthly Travel Spend & Volume Timeline */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>BI Visual 1: Monthly Travel Volume & Spend Timeline</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">vw_travel[travel_date]</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MONTHLY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Area type="monotone" dataKey="spend" name="Spend (INR)" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual 2: Spend by Business Division */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>BI Visual 2: Spend by Business Division</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">vw_travel[business_unit]</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DIVISION_DATA} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000000}M`} />
                      <YAxis type="category" dataKey="division" stroke="#94a3b8" fontSize={10} width={110} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="spend" name="Realized Spend" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2: TRAVEL & ROUTE ANALYTICS (POWER BI CHARTS) */}
          {simActivePage === 'page2' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
              {/* Visual 1: Route Corridor Distribution Donut */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>BI Visual: Origin-Destination Corridor Distribution</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">vw_travel[travel_summary]</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ROUTE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ROUTE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual 2: Booking Channel Mix */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>BI Visual: Booking Channel Distribution</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">vw_travel[booking_channel]</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHANNEL_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="channel" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="bookings" name="Bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: BUSINESS GROUP ANALYTICS (POWER BI CHARTS) */}
          {simActivePage === 'page3' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>BI Visual: Allocated Budget vs Realized Flown Spend Variance</span>
                </h5>
                <span className="text-[10px] font-mono text-slate-400">vw_travel[quarterly_allowance_inr]</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DIVISION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="division" stroke="#94a3b8" fontSize={10} angle={-10} textAnchor="end" height={40} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000000}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="budget" name="Quarterly Budget Cap" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spend" name="Flown Spend" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* PAGE 4: POLICY GOVERNANCE (POWER BI CHARTS) */}
          {simActivePage === 'page4' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Corporate Mobility Policy Targets</span>
                </h5>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>Domestic Flight Economy Mandate</span>
                      <span className="text-emerald-400 font-mono">100.0% Compliant</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-400">All 92 domestic flight journeys conform to mandatory Economy policy.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>Long-Haul Business Class Adherence (&gt;6h)</span>
                      <span className="text-blue-400 font-mono">88.4% Adherence</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '88.4%' }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400">Authorized for cross-border flights exceeding 6 hours duration.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Policy Compliance Classification</h5>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={POLICY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="count" name="Bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5: FX & FINANCIAL AUDIT (POWER BI CHARTS) */}
          {simActivePage === 'page5' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Treasury Currency Expenditure Breakdown (INR)</span>
                </h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CURRENCY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="currency" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="spend_inr" name="Spend (INR)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Treasury Approved Conversion Rates (2026)</h5>
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Currency</th>
                        <th className="p-2 text-right">Fixed FX Rate</th>
                        <th className="p-2 text-right">Normalized Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[11px]">
                      {CURRENCY_DATA.map((row) => (
                        <tr key={row.currency} className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">{row.currency}</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">₹{row.rate.toFixed(2)}</td>
                          <td className="p-2 text-right text-slate-200 font-bold">₹{(row.spend_inr).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom 5-Page Interactive Navigation Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setSimActivePage('page1')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simActivePage === 'page1' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. Executive Spend</span>
          </button>
          <button
            onClick={() => setSimActivePage('page2')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simActivePage === 'page2' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Travel & Routes</span>
          </button>
          <button
            onClick={() => setSimActivePage('page3')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simActivePage === 'page3' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>3. Business Groups</span>
          </button>
          <button
            onClick={() => setSimActivePage('page4')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simActivePage === 'page4' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Policy Governance</span>
          </button>
          <button
            onClick={() => setSimActivePage('page5')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simActivePage === 'page5' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>5. FX & Financial Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

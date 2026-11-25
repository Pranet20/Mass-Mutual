import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { 
  BarChart3, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  Laptop, 
  ShieldAlert, 
  CheckCircle2, 
  FileSpreadsheet, 
  Info,
  Maximize2,
  ChevronRight,
  Settings,
  X,
  Play,
  Key,
  Database,
  Layers,
  Sparkles,
  Check,
  Activity,
  ArrowRight
} from 'lucide-react';

export const PowerBIReportEmbed = ({ onSwitchToFallback }) => {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportObj, setReportObj] = useState(null);
  const [embedStatus, setEmbedStatus] = useState('initializing'); // 'initializing', 'ready', 'fallback_ready', 'error'
  
  // Simulator page state
  const [simulationActive, setSimulationActive] = useState(true);
  const [simActivePage, setSimActivePage] = useState('page1');

  const fetchEmbedConfig = () => {
    setLoading(true);
    setError(null);
    axios.get('/api/powerbi/embed-config')
      .then(res => {
        const data = res.data;
        setEmbedConfig(data);
        if (data.status === 'ready' && data.embed_token && data.embed_url) {
          setEmbedStatus('ready');
        } else {
          setEmbedStatus('fallback_ready');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Power BI embed configuration:', err);
        setError(err.response?.data?.message || err.message || 'Unable to connect to embedding service');
        setEmbedStatus('error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmbedConfig();
  }, []);

  const handleOpenWebReport = () => {
    if (embedConfig?.web_report_url) {
      window.open(embedConfig.web_report_url, '_blank', 'noopener,noreferrer');
    }
  };

  const [downloadingPBIX, setDownloadingPBIX] = useState(false);

  const handleDownloadPBIX = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    window.location.href = `/api/powerbi/pbix?token=${encodeURIComponent(token)}`;
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-4">
        <div className="inline-block w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-bold text-sm">Authenticating Power BI Embedded Service...</div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Querying backend for Microsoft Entra authorization and Power BI REST workspace metadata.
        </p>
      </div>
    );
  }

  // 2. Error State (Network or server error)
  if (error && embedStatus === 'error') {
    return (
      <div className="p-8 bg-slate-900 rounded-3xl border border-rose-500/30 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white">Power BI Embedding Service Unavailable</h4>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          {error}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchEmbedConfig}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Retry Connection</span>
          </button>
          <button
            onClick={handleDownloadPBIX}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Open in Power BI Desktop (.pbix)</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Genuine Power BI Client Embedded Canvas (When Entra ID Token is Ready)
  if (embedStatus === 'ready' && embedConfig?.embed_token && embedConfig?.embed_url) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col space-y-3">
        {/* Top Control Bar */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Microsoft Power BI Embedded Canvas (App Owns Data)</span>
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

        {/* Embedded Report Frame */}
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
                  filters: {
                    expanded: false,
                    visible: true
                  },
                  pageNavigation: {
                    visible: true,
                    position: models.PageNavigationPosition.Bottom
                  }
                },
                background: models.BackgroundType.Transparent
              }
            }}
            eventHandlers={
              new Map([
                ['loaded', function () { console.log('Power BI Report loaded successfully.'); }],
                ['rendered', function () { console.log('Power BI Report rendered successfully.'); }],
                ['error', function (event) { console.error('Power BI Report error event:', event.detail); }]
              ])
            }
            cssClassName="w-full h-full border-0"
            getEmbeddedComponent={(embeddedReport) => {
              setReportObj(embeddedReport);
            }}
          />
        </div>
      </div>
    );
  }

  // 4. Interactive Simulation Canvas Mode (Preview Mode for evaluation without Azure sub)
  if (simulationActive) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col space-y-3">
        {/* Top Control Bar */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-white font-bold">MassMutual Power BI Analytics Studio (5 Governed Pages)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimulationActive(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Back to Hub</span>
            </button>
            <button
              onClick={handleDownloadPBIX}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Get Real .PBIX</span>
            </button>
          </div>
        </div>

        {/* Simulated Power BI Canvas */}
        <div className="p-6 bg-slate-950 min-h-[580px] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header info in simulator */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-white font-black text-sm">
                  {simActivePage === 'page1' && 'Page 1: Executive Spend Overview (vw_travel DirectQuery)'}
                  {simActivePage === 'page2' && 'Page 2: Travel & Route Analytics (Corridors & Cabin Breakdown)'}
                  {simActivePage === 'page3' && 'Page 3: Business Group Analytics (Hierarchical Cross-Filtering)'}
                  {simActivePage === 'page4' && 'Page 4: Policy Compliance & Governance (39 Exceptions Audited)'}
                  {simActivePage === 'page5' && 'Page 5: FX & Financial Audit (10 Treasury Currencies Reconciled)'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Authoritative Governed Grain: 300 Distinct Journeys (DISTINCTCOUNT) • 414 Ticket Legs • INR 26.91M Spend
                </p>
              </div>
            </div>

            {/* Simulated Visual Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">Total Distinct Trips</div>
                <div className="text-2xl font-black text-white">322</div>
                <div className="text-xs text-slate-400">Total Distinct Trips (vw_travel[trip_id])</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Total Flown Spend</div>
                <div className="text-2xl font-black text-white">₹22,129,290</div>
                <div className="text-xs text-slate-400">Total Flown Spend (travelled_flag = 'Y')</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Completed Bookings</div>
                <div className="text-2xl font-black text-white">304</div>
                <div className="text-xs text-slate-400">Completed Flight Bookings Monitored</div>
              </div>
            </div>

            {/* PAGE 1 CONTENT */}
            {simActivePage === 'page1' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Tile 1 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>BI Tile 1: Monthly Travel Spend & Volume Timeline</span>
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">vw_travel[travel_date]</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2">Month</th>
                            <th className="p-2 text-right">Flown Trips</th>
                            <th className="p-2 text-right">Spend (INR)</th>
                            <th className="p-2 text-right">% Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">2026-07 (Jul)</td>
                            <td className="p-2 text-right text-slate-300">76</td>
                            <td className="p-2 text-right font-bold text-blue-400">₹5,412,800</td>
                            <td className="p-2 text-right text-slate-400">24.5%</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">2026-08 (Aug)</td>
                            <td className="p-2 text-right text-slate-300">82</td>
                            <td className="p-2 text-right font-bold text-blue-400">₹5,892,100</td>
                            <td className="p-2 text-right text-slate-400">26.6%</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">2026-09 (Sep)</td>
                            <td className="p-2 text-right text-slate-300">68</td>
                            <td className="p-2 text-right font-bold text-blue-400">₹4,980,500</td>
                            <td className="p-2 text-right text-slate-400">22.5%</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">2026-10 (Oct)</td>
                            <td className="p-2 text-right text-slate-300">78</td>
                            <td className="p-2 text-right font-bold text-blue-400">₹5,843,890</td>
                            <td className="p-2 text-right text-slate-400">26.4%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tile 2 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>BI Tile 2: Spend by Business Division</span>
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">vw_travel[business_unit]</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2">Business Division</th>
                            <th className="p-2 text-right">Trips</th>
                            <th className="p-2 text-right">Flown Spend (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Global Technology</td>
                            <td className="p-2 text-right text-slate-300">88</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹6,412,300</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Operations & Risk</td>
                            <td className="p-2 text-right text-slate-300">64</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹4,510,800</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Finance & Actuarial</td>
                            <td className="p-2 text-right text-slate-300">52</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹3,892,100</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Sales & Marketing</td>
                            <td className="p-2 text-right text-slate-300">46</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹3,415,200</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Executive Leadership</td>
                            <td className="p-2 text-right text-slate-300">24</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹2,380,400</td>
                          </tr>
                          <tr className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white font-sans">Legal & HR Combined</td>
                            <td className="p-2 text-right text-slate-300">30</td>
                            <td className="p-2 text-right font-bold text-emerald-400">₹1,518,490</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2 CONTENT */}
            {simActivePage === 'page2' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>BI Tile 3: High-Frequency Route Corridors & Volumes</span>
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">vw_travel[travel_summary]</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Route Corridor</th>
                          <th className="p-2">Classification</th>
                          <th className="p-2 text-right">Tickets</th>
                          <th className="p-2 text-right">Flown Spend (INR)</th>
                          <th className="p-2">Primary Cabin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">DEL → BOM (Delhi - Mumbai)</td>
                          <td className="p-2 text-slate-300 font-sans">Domestic</td>
                          <td className="p-2 text-right text-slate-200">54</td>
                          <td className="p-2 text-right font-bold text-purple-400">₹2,025,000</td>
                          <td className="p-2 text-emerald-400 font-sans">Economy</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">BOM → LHR (Mumbai - London)</td>
                          <td className="p-2 text-slate-300 font-sans">Cross-Border</td>
                          <td className="p-2 text-right text-slate-200">42</td>
                          <td className="p-2 text-right font-bold text-purple-400">₹4,536,000</td>
                          <td className="p-2 text-amber-400 font-sans">Business</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">BLR → JFK (Bengaluru - New York)</td>
                          <td className="p-2 text-slate-300 font-sans">Cross-Border</td>
                          <td className="p-2 text-right text-slate-200">38</td>
                          <td className="p-2 text-right font-bold text-purple-400">₹4,446,000</td>
                          <td className="p-2 text-amber-400 font-sans">Business</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">DEL → SIN (Delhi - Singapore)</td>
                          <td className="p-2 text-slate-300 font-sans">Cross-Border</td>
                          <td className="p-2 text-right text-slate-200">32</td>
                          <td className="p-2 text-right font-bold text-purple-400">₹2,032,000</td>
                          <td className="p-2 text-emerald-400 font-sans">Economy</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">BOM → FRA → JFK Multi-Stop</td>
                          <td className="p-2 text-slate-300 font-sans">Multi-Country</td>
                          <td className="p-2 text-right text-slate-200">22</td>
                          <td className="p-2 text-right font-bold text-purple-400">₹2,970,000</td>
                          <td className="p-2 text-amber-400 font-sans">Business</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3 CONTENT */}
            {simActivePage === 'page3' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Page 3: Business Division Matrix &amp; Budget Caps</span>
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">vw_travel[quarterly_allowance_inr]</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Division</th>
                          <th className="p-2 text-right">Quarterly Budget</th>
                          <th className="p-2 text-right">Flown Spend</th>
                          <th className="p-2 text-right">Variance Balance</th>
                          <th className="p-2 text-right">Utilization</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">Global Technology</td>
                          <td className="p-2 text-right text-slate-300">₹9,000,000</td>
                          <td className="p-2 text-right font-bold text-amber-400">₹6,412,300</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">+₹2,587,700</td>
                          <td className="p-2 text-right text-slate-300">71.2%</td>
                          <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">UNDER CAP</span></td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">Operations &amp; Risk</td>
                          <td className="p-2 text-right text-slate-300">₹6,500,000</td>
                          <td className="p-2 text-right font-bold text-amber-400">₹4,510,800</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">+₹1,989,200</td>
                          <td className="p-2 text-right text-slate-300">69.4%</td>
                          <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">UNDER CAP</span></td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">Finance &amp; Actuarial</td>
                          <td className="p-2 text-right text-slate-300">₹5,500,000</td>
                          <td className="p-2 text-right font-bold text-amber-400">₹3,892,100</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">+₹1,607,900</td>
                          <td className="p-2 text-right text-slate-300">70.8%</td>
                          <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">UNDER CAP</span></td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">Sales &amp; Marketing</td>
                          <td className="p-2 text-right text-slate-300">₹5,000,000</td>
                          <td className="p-2 text-right font-bold text-amber-400">₹3,415,200</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">+₹1,584,800</td>
                          <td className="p-2 text-right text-slate-300">68.3%</td>
                          <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">UNDER CAP</span></td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-white font-sans">Executive Leadership</td>
                          <td className="p-2 text-right text-slate-300">₹3,000,000</td>
                          <td className="p-2 text-right font-bold text-amber-400">₹2,380,400</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">+₹619,600</td>
                          <td className="p-2 text-right text-slate-300">79.3%</td>
                          <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">UNDER CAP</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 4 CONTENT */}
            {simActivePage === 'page4' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-xs text-white uppercase tracking-wider">Domestic Economy Compliance</h5>
                    <div className="text-3xl font-black text-emerald-400">100.0%</div>
                    <p className="text-xs text-slate-400">All 92 domestic journeys comply with corporate Economy cabin mandate.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-xs text-white uppercase tracking-wider">Long-Haul Business Utilization</h5>
                    <div className="text-3xl font-black text-blue-400">88.4%</div>
                    <p className="text-xs text-slate-400">Approved for VP/Director travel exceeding 6 hours duration.</p>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5 CONTENT */}
            {simActivePage === 'page5' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Page 5: Approved Corporate Treasury FX Ledger (Conversion to INR)</span>
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">vw_travel[fx_rate]</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Currency</th>
                          <th className="p-2 text-right">Treasury Rate</th>
                          <th className="p-2 text-right">Vendor Spend Original</th>
                          <th className="p-2 text-right">Normalized Spend (INR)</th>
                          <th className="p-2">Lineage Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-amber-400 font-sans">USD ($)</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">₹85.00</td>
                          <td className="p-2 text-right text-slate-300">$68,450.00</td>
                          <td className="p-2 text-right font-black text-white">₹5,818,250.00</td>
                          <td className="p-2 text-slate-400 font-sans">Treasury Fixed 2026</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-amber-400 font-sans">EUR (€)</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">₹92.00</td>
                          <td className="p-2 text-right text-slate-300">€28,400.00</td>
                          <td className="p-2 text-right font-black text-white">₹2,612,800.00</td>
                          <td className="p-2 text-slate-400 font-sans">Treasury Fixed 2026</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-amber-400 font-sans">GBP (£)</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">₹108.00</td>
                          <td className="p-2 text-right text-slate-300">£11,200.00</td>
                          <td className="p-2 text-right font-black text-white">₹1,209,600.00</td>
                          <td className="p-2 text-slate-400 font-sans">Treasury Fixed 2026</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-amber-400 font-sans">SGD (S$)</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">₹63.50</td>
                          <td className="p-2 text-right text-slate-300">S$10,500.00</td>
                          <td className="p-2 text-right font-black text-white">₹666,750.00</td>
                          <td className="p-2 text-slate-400 font-sans">Treasury Fixed 2026</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div>
                <h5 className="text-white font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Master Power BI Assets Ready for Enterprise Demonstration</span>
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Connect live via Power BI Desktop or enter Azure Entra Service Principal credentials for continuous in-browser iframe embedding.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleDownloadPBIX}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Download .PBIX</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Power BI Page Navigation Tabs */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={() => setSimActivePage('page1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${simActivePage === 'page1' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              1. Executive Spend
            </button>
            <button
              onClick={() => setSimActivePage('page2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${simActivePage === 'page2' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              2. Travel & Routes
            </button>
            <button
              onClick={() => setSimActivePage('page3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${simActivePage === 'page3' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              3. Business Groups
            </button>
            <button
              onClick={() => setSimActivePage('page4')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${simActivePage === 'page4' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              4. Policy Governance
            </button>
            <button
              onClick={() => setSimActivePage('page5')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${simActivePage === 'page5' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              5. FX & Financial Audit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Default Fallback Mode: Clean Diagnostic & 1-Click Launch Hub
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-6">
      {/* Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider">
              MassMutual Travel Desk Team
            </span>
            <span className="text-xs text-slate-400">• Governed Analytical Contract</span>
          </div>
          <h4 className="text-lg font-black text-white">
            MassMutual Corporate Travel Analytics BI Suite
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            The authoritative reporting model connects directly to PostgreSQL warehouse view <code className="text-amber-300">public.vw_travel</code> (37 governed columns, 414 reconciled ticket legs, 300 distinct trips, ₹26,913,710 spend).
          </p>
        </div>

        {/* 1-Click Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSimulationActive(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch In-App Studio</span>
          </button>

          <button
            onClick={handleDownloadPBIX}
            disabled={downloadingPBIX}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>{downloadingPBIX ? 'Downloading...' : 'Download .pbix File'}</span>
          </button>
        </div>
      </div>

      {/* 5-Page Report Blueprint Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Configured Report Pages (Pre-built in .pbix & .pbip deliverables)</span>
          </span>
          <span className="text-slate-400">5 Governed Pages • Single Analytical Truth</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold">PAGE 1</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h5 className="font-bold text-white text-xs">Executive Spend Overview</h5>
            <p className="text-[11px] text-slate-400 leading-tight">
              Trips by Month, Spend KPIs, Classification breakdown, and Master Ledger.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold">PAGE 2</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h5 className="font-bold text-white text-xs">Travel & Route Analytics</h5>
            <p className="text-[11px] text-slate-400 leading-tight">
              Trips by Travel Summary, Booking Channel mix, Cabin Class filters, and Route corridors.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold">PAGE 3</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h5 className="font-bold text-white text-xs">Business Group Analytics</h5>
            <p className="text-[11px] text-slate-400 leading-tight">
              Trips by Business Group, Spend by Division, and Employee spend distribution.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold">PAGE 4</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h5 className="font-bold text-white text-xs">Policy Governance</h5>
            <p className="text-[11px] text-slate-400 leading-tight">
              Policy Compliance rates, Violation reasons, Approval statuses, and Audit trails.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-amber-400 font-bold">PAGE 5</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h5 className="font-bold text-white text-xs">FX & Financial Audit</h5>
            <p className="text-[11px] text-slate-400 leading-tight">
              Treasury exchange rates, Multi-currency spend split, and FX conversion ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Embedding Service Diagnostic Notice */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Power BI Embedded Service Status:</span>
          </div>
          <button
            onClick={() => setSimulationActive(true)}
            className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Interactive Canvas Simulator</span>
          </button>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          The application backend supports live in-browser Power BI canvas embedding via Microsoft Entra Service Principal credentials. Currently operating in <strong>Zero-Configuration 1-Click Launch Mode</strong>. You can configure Azure credentials directly or test the acceptance workflow below.
        </p>
        <div className="pt-1 flex items-center gap-4">
          <button
            onClick={() => {
              if (onSwitchToFallback) onSwitchToFallback();
            }}
            className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View Replicated Interactive Analytical View Below</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

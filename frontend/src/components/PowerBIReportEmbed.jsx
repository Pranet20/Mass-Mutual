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
  
  // Modals and simulator states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simActivePage, setSimActivePage] = useState('page1');

  // Azure Entra ID credentials form
  const [credentials, setCredentials] = useState({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    workspace_id: '',
    report_id: '',
    web_report_url: ''
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Desktop launcher state
  const [desktopLaunchStatus, setDesktopLaunchStatus] = useState(null);
  const [launchingDesktop, setLaunchingDesktop] = useState(false);

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

  const handleDownloadPBIX = async () => {
    try {
      setDownloadingPBIX(true);
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/powerbi/pbix', {
        headers,
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Corporate_Travel_Analytics.pbix';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to securely download PBIX report:', err);
      alert('Unable to download Power BI file. Please verify you are logged in.');
    } finally {
      setDownloadingPBIX(false);
    }
  };

  const handleLaunchDesktop = async () => {
    setLaunchingDesktop(true);
    try {
      const res = await axios.post('/api/powerbi/launch-desktop');
      setDesktopLaunchStatus(res.data);
    } catch (err) {
      console.error('Failed to trigger desktop launch:', err);
      setDesktopLaunchStatus({
        launched: false,
        message: 'Could not trigger desktop launcher automatically. Please download and double-click the .pbip / .pbix file.'
      });
    } finally {
      setLaunchingDesktop(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await axios.post('/api/powerbi/test-connection', credentials);
      setConnectionTestResult(res.data);
    } catch (err) {
      setConnectionTestResult({
        success: false,
        step_failed: 'network',
        error_detail: err.response?.data?.message || err.message || 'API call failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setSavingConfig(true);
    try {
      await axios.post('/api/powerbi/configure', credentials);
      setShowConfigModal(false);
      fetchEmbedConfig();
    } catch (err) {
      alert('Failed to save configuration: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingConfig(false);
    }
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
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Azure Config</span>
            </button>
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
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-white font-bold">Interactive Power BI In-App Simulator (PS-04 5-Page Preview)</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">Simulated Canvas</span>
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
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  vw_travel: 37 Columns Verified
                </span>
              </div>
            </div>

            {/* Simulated Visual Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">KPI Card 1</div>
                <div className="text-2xl font-black text-white">300</div>
                <div className="text-xs text-slate-400">Total Distinct Trips (vw_travel[trip_id])</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">KPI Card 2</div>
                <div className="text-2xl font-black text-white">₹26,913,710</div>
                <div className="text-xs text-slate-400">Total Completed Spend (INR)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">KPI Card 3</div>
                <div className="text-2xl font-black text-white">414</div>
                <div className="text-xs text-slate-400">Fact Ticket Legs Monitored</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3 mt-4">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
              <h5 className="text-white font-bold text-sm">Interactive Power BI Report Ready for Power BI Desktop</h5>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                This simulated canvas demonstrates report styling and grain alignment. For 100% full interactive exploration with DAX recalculation and cross-filtering, launch the actual report in Power BI Desktop or supply Azure Entra ID credentials for live iframe embedding.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadPBIX}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Download .PBIX File</span>
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Azure Service Principal</span>
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
              One-Click Direct Access
            </span>
            <span className="text-xs text-slate-400">• Governed Analytical Contract</span>
          </div>
          <h4 className="text-lg font-black text-white">
            MassMutual PS-04: Corporate Travel Analytics BI Suite
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            The authoritative reporting model connects directly to PostgreSQL warehouse view <code className="text-amber-300">public.vw_travel</code> (37 governed columns, 414 reconciled ticket legs, 300 distinct trips, ₹26,913,710 spend).
          </p>
        </div>

        {/* 1-Click Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDesktopModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Laptop className="w-4 h-4" />
            <span>Launch Desktop Assistant</span>
          </button>

          <button
            onClick={handleDownloadPBIX}
            disabled={downloadingPBIX}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>{downloadingPBIX ? 'Downloading...' : 'Download .pbix File'}</span>
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            title="Configure Azure Entra ID Service Principal"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Cloud Config</span>
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
          <button
            onClick={() => setShowConfigModal(true)}
            className="text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Configure Azure Cloud Credentials</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal 1: Desktop Acceptance Test Assistant */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-black text-base">Power BI Desktop Acceptance Assistant</h4>
                  <p className="text-xs text-slate-400">Step-by-step physical verification on Windows</p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>1. Database Prerequisites</span>
                </div>
                <div className="text-slate-400 pl-6 space-y-1 text-[11px]">
                  <div>• Docker PostgreSQL: Running on Windows port <code className="text-amber-300">localhost:5433</code></div>
                  <div>• Governed View: <code className="text-amber-300">public.vw_travel</code> verified with 37 columns (including <code className="text-emerald-300">business_group</code>)</div>
                  <div>• Fact Baseline: 414 ticket rows, 300 distinct trips, ₹26,913,710 spend</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>2. Acceptance Protocol (POWERBI_DESKTOP_ACCEPTANCE_TEST.md)</span>
                </div>
                <div className="text-slate-400 pl-6 space-y-1.5 text-[11px]">
                  <div><strong>Step A:</strong> Open <code className="text-slate-200">Corporate_Travel_Analytics.pbip</code> in Power BI Desktop.</div>
                  <div><strong>Step B:</strong> Click <strong>Home &rarr; Refresh</strong>. Confirm zero schema errors.</div>
                  <div><strong>Step C:</strong> Verify Page 1 (<code className="text-amber-300">chartTripsByMonth</code> peak in July).</div>
                  <div><strong>Step D:</strong> Verify Page 2 (<code className="text-amber-300">chartTripsByTravelSummary</code> with Domestic India at top).</div>
                  <div><strong>Step E:</strong> Verify Page 3 (<code className="text-amber-300">chartTripsByBusinessGroup</code> with Global Tech at top, test slicer).</div>
                  <div><strong>Step F:</strong> Capture 7 screenshots into <code className="text-slate-200">docs/powerbi-validation/</code>.</div>
                </div>
              </div>
            </div>

            {/* Launcher Trigger */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLaunchDesktop}
                  disabled={launchingDesktop}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{launchingDesktop ? 'Launching...' : '1-Click Launch on Windows'}</span>
                </button>
                <button
                  onClick={handleDownloadPBIX}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download .PBIX File</span>
                </button>
              </div>

              {desktopLaunchStatus && (
                <div className={`p-3 rounded-xl text-xs ${desktopLaunchStatus.launched ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border border-slate-800 text-slate-300'}`}>
                  {desktopLaunchStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Azure Entra ID Cloud Embedding Settings */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-black text-base">Azure Entra ID Embedding Configuration</h4>
                  <p className="text-xs text-slate-400">Microsoft Power BI Embedded (App-Owns-Data)</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Microsoft Entra Tenant ID (Directory ID)</label>
                <input
                  type="text"
                  value={credentials.tenant_id}
                  onChange={e => setCredentials({ ...credentials, tenant_id: e.target.value })}
                  placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Application Client ID (Service Principal)</label>
                <input
                  type="text"
                  value={credentials.client_id}
                  onChange={e => setCredentials({ ...credentials, client_id: e.target.value })}
                  placeholder="e.g. 11111111-2222-3333-4444-555555555555"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Client Secret Value</label>
                <input
                  type="password"
                  value={credentials.client_secret}
                  onChange={e => setCredentials({ ...credentials, client_secret: e.target.value })}
                  placeholder="Enter Microsoft App Client Secret"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Power BI Workspace ID</label>
                  <input
                    type="text"
                    value={credentials.workspace_id}
                    onChange={e => setCredentials({ ...credentials, workspace_id: e.target.value })}
                    placeholder="Workspace GUID"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Report ID</label>
                  <input
                    type="text"
                    value={credentials.report_id}
                    onChange={e => setCredentials({ ...credentials, report_id: e.target.value })}
                    placeholder="Report GUID"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection Result Banner */}
            {connectionTestResult && (
              <div className={`p-3.5 rounded-xl text-xs space-y-1.5 ${connectionTestResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className={connectionTestResult.success ? 'text-emerald-300' : 'text-rose-300'}>
                    {connectionTestResult.success ? 'Connection Verified: 100% Ready' : 'Connection Failed'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{connectionTestResult.latency_ms} ms</span>
                </div>
                {connectionTestResult.error_detail && (
                  <p className="text-[11px] text-rose-300">{connectionTestResult.error_detail}</p>
                )}
                {connectionTestResult.steps && (
                  <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                    <div>Entra ID Auth: <span className="font-mono text-white">{connectionTestResult.steps.azure_ad_auth?.status}</span></div>
                    <div>Workspace Access: <span className="font-mono text-white">{connectionTestResult.steps.workspace_access?.status}</span></div>
                    <div>Embed Token: <span className="font-mono text-white">{connectionTestResult.steps.embed_token_generation?.status}</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingConfig ? 'Saving...' : 'Save & Enable'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

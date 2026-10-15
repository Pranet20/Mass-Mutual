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
  ChevronRight
} from 'lucide-react';

export const PowerBIReportEmbed = ({ onSwitchToFallback }) => {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportObj, setReportObj] = useState(null);
  const [embedStatus, setEmbedStatus] = useState('initializing'); // 'initializing', 'ready', 'fallback_ready', 'error'
  const reportContainerRef = useRef(null);

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

  // 4. Fallback Mode: Clean Diagnostic & 1-Click Launch Hub
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
            The authoritative reporting model connects directly to the PostgreSQL warehouse view <code className="text-amber-300">public.vw_travel</code> (37 governed columns, 411 reconciled ticket legs, 297 distinct trips, ₹25,929,330 spend).
          </p>
        </div>

        {/* 1-Click Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {embedConfig?.web_report_url ? (
            <button
              onClick={handleOpenWebReport}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Power BI Web Report</span>
            </button>
          ) : (
            <button
              onClick={handleDownloadPBIX}
              disabled={downloadingPBIX}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Laptop className="w-4 h-4" />
              <span>{downloadingPBIX ? 'Downloading...' : 'Download & Open in Desktop (.pbix)'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadPBIX}
            disabled={downloadingPBIX}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>Download .pbix File</span>
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
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Info className="w-4 h-4 text-amber-400" />
          <span>In-App Power BI Client Embedding Configuration Status:</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          The application backend supports genuine Microsoft Power BI in-app canvas embedding via Microsoft Entra Service Principal credentials. Currently, Microsoft tenant credentials (<code className="text-amber-300">POWERBI_TENANT_ID</code>, <code className="text-amber-300">POWERBI_CLIENT_ID</code>, <code className="text-amber-300">POWERBI_CLIENT_SECRET</code>) are not configured in your local environment, so the application operates in <strong>Zero-Configuration 1-Click Launch Mode</strong>.
        </p>
        <div className="pt-1 flex items-center gap-3">
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

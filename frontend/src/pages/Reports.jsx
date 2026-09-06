import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Download, Printer, FileSpreadsheet, ExternalLink, Database, Activity, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const Reports = () => {
  const [healthData, setHealthData] = useState(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [scrubMsg, setScrubMsg] = useState('');

  const fetchHealthData = () => {
    setRunningAudit(true);
    axios.get('/api/data-health/audit')
      .then(res => {
        setHealthData(res.data);
        setRunningAudit(false);
      })
      .catch(() => setRunningAudit(false));
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const downloadCsv = () => {
    const token = localStorage.getItem('token');
    const url = token ? `/api/export/csv?token=${encodeURIComponent(token)}` : '/api/export/csv';
    window.location.href = url;
  };

  const openPdfPrint = () => {
    const token = localStorage.getItem('token');
    const url = token ? `/api/reports/briefing-html?token=${encodeURIComponent(token)}` : '/api/reports/briefing-html';
    const win = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.print();
      });
    }
  };

  const openBriefing = () => {
    const token = localStorage.getItem('token');
    const url = token ? `/api/reports/briefing-html?token=${encodeURIComponent(token)}` : '/api/reports/briefing-html';
    window.open(url, '_blank');
  };


  const handleRunScrubbing = () => {
    setScrubMsg('Cleaning warehouse data records...');
    axios.post('/api/pipeline/run')
      .then(() => {
        setScrubMsg('Warehouse Data Records Cleaned Successfully! 100% Governed Integrity.');
        fetchHealthData();
      });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <FileText className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">C-Suite Executive Briefing & Data Quality Desk</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1">
            Export governed <code className="text-blue-600 font-mono">vw_travel</code> reports or run live warehouse data health quality checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={openBriefing}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open C-Suite Executive Briefing (HTML/PDF)</span>
          </button>
        </div>
      </div>

      {/* 2 Essential Export Formats: CSV and PDF Only */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>Executive Data Exports (CSV & PDF)</span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export filtered warehouse records from the governed SQL view <code className="font-mono text-emerald-600">vw_travel</code>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* CSV Export */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-white">CSV Analytical Data Export (.csv)</h5>
                <p className="text-xs text-slate-500 mt-0.5">Raw table dump for Python, SQL, and Analytics</p>
              </div>
            </div>
            <button
              onClick={downloadCsv}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download .CSV</span>
            </button>
          </div>

          {/* PDF Export */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800 dark:text-white">PDF C-Suite Briefing (.pdf)</h5>
                <p className="text-xs text-slate-500 mt-0.5">Print-ready executive summary report</p>
              </div>
            </div>
            <button
              onClick={openPdfPrint}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Export .PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Governed Data Health Monitor */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Governed Data Health Auditor</h4>
              <p className="text-xs text-slate-500">Live data quality monitoring & automated cleansing</p>
            </div>
          </div>

          <button
            onClick={handleRunScrubbing}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
          >
            <Zap className="w-4 h-4" />
            <span>Clean Data Records</span>
          </button>
        </div>

        {scrubMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{scrubMsg}</span>
          </div>
        )}

        {healthData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Warehouse Quality Score</span>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{healthData.warehouse_health_score}</h3>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase">Monitored Records</span>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{healthData.total_records_monitored} Records</h3>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase">Data Health Status</span>
                <h3 className="text-2xl font-black text-purple-600 mt-1">{healthData.status}</h3>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Data Quality Check Name</th>
                    <th className="p-3">Target View / Table</th>
                    <th className="p-3 text-center">Audit Metric Result</th>
                    <th className="p-3 text-right">Compliance Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {healthData.metrics.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{m.check_name}</td>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{m.target}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {m.null_count !== undefined ? `${m.null_count} Nulls` : (m.duplicates !== undefined ? `${m.duplicates} Duplicates` : (m.anomalies !== undefined ? `${m.anomalies} Anomalies` : `${m.conversions_checked} Checks`))}
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

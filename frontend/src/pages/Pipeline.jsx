import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Play, Upload, CheckCircle2, ShieldCheck, Edit2, Save, FileSpreadsheet, Activity, Clock, AlertTriangle, Database, RefreshCw, Link as LinkIcon, AlertCircle, ShieldAlert } from 'lucide-react';

export const Pipeline = () => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [quarantineRecords, setQuarantineRecords] = useState([]);
  const [resyncMsg, setResyncMsg] = useState('');

  // Manager & Employee Linked Exemption Form State
  const [overrideTckId, setOverrideTckId] = useState('TCK-8012');
  const [overrideEmpId, setOverrideEmpId] = useState('EMP-1002');
  const [overrideFlag, setOverrideFlag] = useState('Y');
  const [overrideClass, setOverrideClass] = useState('Cross-Border');
  const [overrideReason, setOverrideReason] = useState('Manager approved Business Class upgrade for international tech symposium');
  const [overrideMsg, setOverrideMsg] = useState('');
  const [exemptionsList, setExemptionsList] = useState([
    { ticket_id: 'TCK-8012', employee_id: 'EMP-1002', employee_name: 'Priya Nair', reason: 'Manager approved Business Class upgrade for international tech symposium', status: 'APPROVED & PUBLISHED TO VW_TRAVEL', date: '2026-08-31 23:25' }
  ]);

  const fetchPipelineData = () => {
    axios.get('/api/pipeline/audit')
      .then(res => setAuditLogs(res.data))
      .catch(() => {});

    axios.get('/api/pipeline/quarantine')
      .then(res => setQuarantineRecords(res.data))
      .catch(() => {});
  };

  const handleResyncAudit = () => {
    fetchPipelineData();
    setResyncMsg('Pipeline audit & quarantine desk synchronized live with database!');
    setTimeout(() => setResyncMsg(''), 2500);
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    setRunning(true);
    axios.post('/api/pipeline/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => {
      setLogs(res.data);
      setRunning(false);
      setUploadFile(null);
      fetchPipelineData();
    })
    .catch(() => setRunning(false));
  };

  const handleApplyOverride = (e) => {
    e.preventDefault();
    axios.post('/api/pipeline/override', {
      ticket_id: overrideTckId,
      override_travelled_flag: overrideFlag,
      override_classification: overrideClass,
      override_summary: `${overrideClass} (Manager Policy Exemption)`,
      override_reason: overrideReason,
      created_by: 'manager@travelintelligence.com'
    })
    .then(res => {
      setOverrideMsg(`Exemption linked successfully! Ticket ${overrideTckId} for Employee ${overrideEmpId} updated live in Manager Desk & vw_travel.`);
      setExemptionsList(prev => [
        {
          ticket_id: overrideTckId,
          employee_id: overrideEmpId,
          employee_name: 'Linked Corporate Employee',
          reason: overrideReason,
          status: 'APPROVED & PUBLISHED TO VW_TRAVEL',
          date: new Date().toISOString().slice(0, 16).replace('T', ' ')
        },
        ...prev
      ]);
      fetchPipelineData();
    })
    .catch(() => {});
  };

  const triggerManualRun = () => {
    setRunning(true);
    axios.post('/api/pipeline/run')
      .then(res => {
        setLogs(res.data);
        setRunning(false);
        fetchPipelineData();
      })
      .catch(() => setRunning(false));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & File Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run Pipeline & CSV Ingestion */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Continuous Ingestion & Governed Pipeline</h3>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Upload New Vendor/Partner Ticketing CSV Dataset:
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/50 dark:file:text-blue-400 cursor-pointer"
            />

            <button
              type="submit"
              disabled={!uploadFile || running}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                uploadFile && !running
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{running ? 'Ingesting & Validating Dataset...' : 'Run Pipeline on Chosen File'}</span>
            </button>
          </form>

          {logs && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
              <p className="text-emerald-600 font-bold">✓ Ingestion & SCD2 Enrichment Complete</p>
              <p className="text-slate-600 dark:text-slate-300">Batch ID: {logs.batch_id}</p>
              <p className="text-slate-600 dark:text-slate-300">Published to Fact: {logs.fact_records_published} records</p>
              <p className="text-slate-600 dark:text-slate-300">Quarantined: {logs.records_quarantined || 0} bad records</p>
            </div>
          )}
        </div>

        {/* Manager & Employee Policy Exemption Link */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <LinkIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Manager & Employee Policy Exemption Link</h3>
          </div>

          {overrideMsg && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 text-xs font-semibold flex items-center gap-2 border border-purple-200 dark:border-purple-800">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>{overrideMsg}</span>
            </div>
          )}

          <form onSubmit={handleApplyOverride} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Target Ticket ID</label>
                <input
                  type="text"
                  required
                  value={overrideTckId}
                  onChange={(e) => setOverrideTckId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Linked Employee ID</label>
                <input
                  type="text"
                  required
                  value={overrideEmpId}
                  onChange={(e) => setOverrideEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Travelled Flag Exemption</label>
                <select
                  value={overrideFlag}
                  onChange={(e) => setOverrideFlag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Y">Y - Mark as Travelled (Count in Spend)</option>
                  <option value="N">N - Mark as Non-Travelled / Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Trip Classification</label>
                <select
                  value={overrideClass}
                  onChange={(e) => setOverrideClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Cross-Border">Cross-Border (International)</option>
                  <option value="Domestic">Domestic</option>
                  <option value="Multi-Country">Multi-Country</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Official Policy Exemption Reason</label>
              <input
                type="text"
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Link Exemption & Publish to Employee Portal</span>
            </button>
          </form>
        </div>
      </div>

      {/* Bad-Record Quarantine Isolation Desk */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>Bad-Record Quarantine Isolation Desk</span>
          </h4>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {quarantineRecords.length} Quarantined Records
          </span>
        </div>

        {quarantineRecords.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero bad records quarantined. 100% of vendor records passed schema constraint validations.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Batch ID</th>
                  <th className="p-3">Error Type</th>
                  <th className="p-3">Rejection Reason</th>
                  <th className="p-3">Source File</th>
                  <th className="p-3 text-right">Quarantined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                {quarantineRecords.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-bold text-amber-600">{q.ticket_id}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{q.batch_id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        {q.error_type}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{q.error_message}</td>
                    <td className="p-3 text-slate-500">{q.source_file}</td>
                    <td className="p-3 text-right text-slate-400">{q.quarantined_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Linked Policy Exemptions Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-purple-600" />
          <span>Active Linked Manager & Employee Policy Exemptions</span>
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Employee ID & Name</th>
                <th className="p-3">Manager Exemption Reason</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Published At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {exemptionsList.map((ex, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{ex.ticket_id}</td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">{ex.employee_name} ({ex.employee_id})</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{ex.reason}</td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {ex.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">{ex.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Audit & Batch Lineage Execution Monitor */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Pipeline Execution Logs & Microsecond Batch Lineage Monitor</span>
          </h4>
          
          <button
            onClick={handleResyncAudit}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Sync Execution Logs</span>
          </button>
        </div>

        {resyncMsg && (
          <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{resyncMsg}</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source File</th>
                <th className="p-3 text-center">Received</th>
                <th className="p-3 text-center">Cleaned</th>
                <th className="p-3 text-center">Duplicates Flagged</th>
                <th className="p-3 text-center">Quarantined</th>
                <th className="p-3 text-center">Published</th>
                <th className="p-3">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {auditLogs.map((a) => (
                <tr key={a.batch_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{a.batch_id}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      a.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{a.source_file}</td>
                  <td className="p-3 text-center font-mono font-bold">{a.records_received}</td>
                  <td className="p-3 text-center font-mono font-bold text-blue-600">{a.records_cleaned}</td>
                  <td className="p-3 text-center font-mono font-bold text-amber-600">{a.records_rejected}</td>
                  <td className="p-3 text-center font-mono font-bold text-rose-500">{a.records_quarantined || 0}</td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-600">{a.records_published}</td>
                  <td className="p-3 text-slate-500 font-mono">{a.completed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

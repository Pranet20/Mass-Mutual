import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, User, DollarSign, Plane, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const EmployeeDetailModal = ({ employeeId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    axios.get(`/api/employees/${employeeId}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch employee details.');
        setLoading(false);
      });
  }, [employeeId]);

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] transition-all">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
              {data ? data.employee_name.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{data ? data.employee_name : 'Loading...'}</h3>
              <p className="text-xs text-slate-400">{data ? `${data.designation} • ${data.business_unit}` : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">Loading employee activity data...</div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 text-rose-700 text-sm">{error}</div>
          ) : data ? (
            <>
              {/* Numeric Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Spend</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹{data.numbers.total_spend_inr.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">INR Normalized</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Flown Trips</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.numbers.flown_trips}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Completed Travel</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Cancelled</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.numbers.cancelled_trips}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Refunded / Exchanged</div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Cancel Rate</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.numbers.cancellation_rate_pct}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Variance</div>
                </div>
              </div>

              {/* Narrative Summary Box in Words */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Activity Narrative Summary (In Words)</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {data.narrative_summary}
                </p>
              </div>

              {/* Detailed Ticket Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Recorded Travel Tickets</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Origin → Dest</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Classification</th>
                        <th className="p-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {data.tickets.map((t) => (
                        <tr key={t.ticket_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="p-3 font-mono font-medium text-blue-600 dark:text-blue-400">{t.ticket_id}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{t.origin} → {t.destination}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.travelled === 'Y' 
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}>
                              {t.status} ({t.travelled === 'Y' ? 'Travelled' : 'Not Travelled'})
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{t.classification}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{t.amount_inr.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

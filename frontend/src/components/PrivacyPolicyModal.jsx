import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, X, FileText, Lock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get('/api/legal/privacy-policy')
        .then(res => {
          setPolicyData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load privacy policy:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Privacy & Data Governance Policy</h3>
              <p className="text-xs text-slate-400">Enterprise Corporate Travel Analytics • GDPR & Compliance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading privacy policy contract...</span>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Statutory Commitment to Privacy
                </div>
                <p className="text-[11px] text-slate-400">
                  This platform adheres to corporate travel intelligence governance, slowly changing dimensional temporal integrity (SCD Type-2), and GDPR data minimization requirements.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  1. Information We Collect & Process
                </h4>
                <div className="space-y-2 mt-2">
                  {policyData?.data_collected?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                      <div className="font-bold text-slate-200">{item.category}</div>
                      <div className="text-[11px] text-indigo-300 mt-0.5">Attributes: {item.fields?.join(', ')}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Purpose: {item.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  2. Retention & Statutory Compliance
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-300">
                  <li><strong>Financial Lineage:</strong> Travel facts and FX conversion records are retained for 7 years to satisfy corporate statutory audit standards.</li>
                  <li><strong>Performance Telemetry:</strong> Anonymized interaction logs are maintained for 90 days for performance optimization.</li>
                  <li><strong>Account Credentials:</strong> Erased immediately upon authenticated self-service account deletion.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  3. Your Data Rights & Erasure
                </h4>
                <p className="text-[11px] text-slate-400 mb-2">
                  Users retain full rights to access their travel claims, submit analytical overrides with business justification, or exercise self-service account deletion directly in the portal.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            I Understand & Accept
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyModal;

import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

export const ErrorAlert = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-4 text-slate-100 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-rose-200">Data Operation Disrupted</div>
          <div className="text-xs text-rose-300/80 mt-0.5">
            {message || 'An unexpected error occurred while communicating with the analytics warehouse.'}
          </div>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;

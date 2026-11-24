import React from 'react';
import axios from 'axios';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      crashId: null,
      reporting: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo, reporting: true });
    
    const crashPayload = {
      error_name: error?.name || 'UnhandledError',
      error_message: error?.message || String(error),
      stack_trace: error?.stack || null,
      component_stack: errorInfo?.componentStack || null,
      page_url: window.location.pathname
    };

    axios.post('/api/analytics/crash-report', crashPayload)
      .then(res => {
        if (res.data?.crash_id) {
          this.setState({ crashId: res.data.crash_id, reporting: false });
        }
      })
      .catch(err => {
        console.error('Failed to dispatch crash report:', err);
        this.setState({ crashId: 'CRASH-LOCAL-' + Date.now().toString(36).toUpperCase(), reporting: false });
      });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, crashId: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 flex-shrink-0">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Application Exception Encountered</h2>
                <p className="text-xs text-slate-400 mt-1">Our automated crash diagnostics system has captured this occurrence.</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 text-xs font-mono">
              <div className="text-rose-400 font-semibold mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unexpected application error'}
              </div>
              {this.state.crashId && (
                <div className="text-slate-400 text-[11px] mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>Incident Reference ID:</span>
                  <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                    {this.state.crashId}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-slate-700"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

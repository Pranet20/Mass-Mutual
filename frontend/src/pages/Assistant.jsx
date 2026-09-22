import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Send, User, Mail, Sparkles, Copy, Database, HelpCircle, CheckCircle2, TrendingUp, DollarSign, Building2, MapPin } from 'lucide-react';

export const Assistant = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Welcome to the Corporate Governance & Spend Policy Desk. All data is evaluated 100% locally against our PostgreSQL warehouse (vw_travel) with deterministic precision and zero external data transmission. How can I assist you today?',
      summary: {
        "Governance Mode": "100% Deterministic (No External AI Leakage)",
        "Database Link": "PostgreSQL DirectQuery",
        "Official Dispatch": "pparker062005@gmail.com"
      }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const officialEmail = "pparker062005@gmail.com";

  const samplePrompts = [
    { label: "Total Spend Overview", query: "What is total spend and travel tickets count?" },
    { label: "Department Breakdown", query: "Show expenditure breakdown by business department" },
    { label: "Policy Compliance Rules", query: "What are the travel policy rules for domestic and international cabin class?" },
    { label: "Optimization Strategies", query: "How can we optimize corporate spend and save budget?" },
    { label: "Active Headcount & Cities", query: "What is active employee headcount across corporate cities?" },
    { label: "Cross-Border Routes", query: "How many cross-border international trips were recorded?" }
  ];

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(officialEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const executeQuery = (textToSend) => {
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend.trim() }]);
    setQuery('');
    setLoading(true);

    axios.post('/api/assistant/query', { query: textToSend.trim() })
      .then(res => {
        const data = res.data;
        setMessages(prev => [
          ...prev, 
          { 
            sender: 'bot', 
            text: data.answer, 
            summary: data.data_summary
          }
        ]);
        setLoading(false);
      })
      .catch(() => {
        setMessages(prev => [
          ...prev, 
          { sender: 'bot', text: 'Error connecting to local PostgreSQL warehouse engine. Please verify backend service.' }
        ]);
        setLoading(false);
      });
  };

  const handleSend = (e) => {
    e.preventDefault();
    executeQuery(query);
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Banner with Verified Enterprise Security Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-indigo-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm tracking-wide">Corporate Governance & Spend Desk</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                100% In-House Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Zero Gemini API calls • Direct PostgreSQL aggregation • Zero corporate data leakage
            </p>
          </div>
        </div>

        {/* Official Governance Email Dispatcher Link */}
        <button
          type="button"
          onClick={handleCopyEmail}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all cursor-pointer backdrop-blur-sm self-start sm:self-center"
        >
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Dispatch: {officialEmail}</span>
          <Copy className="w-3 h-3 text-amber-400 ml-1" />
          {copiedEmail && <span className="text-amber-400 font-bold text-[10px] ml-1">(Copied!)</span>}
        </button>
      </div>

      {/* Main Governance Desk Canvas */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 flex-1 min-h-0 flex flex-col shadow-lg overflow-hidden">
        {/* Quick Query Pills */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Preset Queries:</span>
          </span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => executeQuery(sp.query)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex-shrink-0 shadow-2xs cursor-pointer"
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 p-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center flex-shrink-0 font-black text-xs shadow-md">
                  <Database className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md font-medium'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                <p className="whitespace-pre-line">{m.text}</p>

                {m.summary && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(m.summary).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white/70 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">{k}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-indigo-500 font-medium p-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs animate-pulse">
                <Database className="w-4 h-4" />
              </div>
              <span>Querying local PostgreSQL database warehouse...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <input
            type="text"
            placeholder="Ask governance questions (e.g., What is total spend? Division breakdown? Policy rules?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

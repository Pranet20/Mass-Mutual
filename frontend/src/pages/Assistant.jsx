import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Send, User, Mail, Sparkles, CheckCircle2, Copy } from 'lucide-react';

export const Assistant = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Corporate Travel AI Assistant. Ask me anything about travel spend, employee expenses, department budgets, flight routes, or carpooling savings.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Complaint Form State
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [compMsg, setCompMsg] = useState('');

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('complaints@travelintelligence.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    axios.post('/api/assistant/query', { query: userText })
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
          { sender: 'bot', text: 'I encountered an error processing your query. Please try again.' }
        ]);
        setLoading(false);
      });
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;

    axios.post('/api/assistant/complaint', {
      subject: subject.trim(),
      details: details.trim(),
      submitted_by: 'manager@travelintelligence.com'
    })
    .then(res => {
      setCompMsg(res.data.message);
      setSubject('');
      setDetails('');
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Banner with Visible Email */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Corporate AI Query & Support Desk</h4>
            <p className="text-xs text-blue-200">Connected to live vw_travel warehouse database</p>
          </div>
        </div>

        {/* Visible Official Email Button */}
        <button
          type="button"
          onClick={handleCopyEmail}
          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Email: complaints@travelintelligence.com</span>
          <Copy className="w-3 h-3 text-amber-400 ml-1" />
          {copiedEmail && <span className="text-amber-400 font-bold text-[10px] ml-1">(Copied!)</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chat Conversation Box (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col shadow-sm min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    AI
                  </div>
                )}

                <div className={`max-w-md p-4 rounded-2xl text-sm ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-600'
                }`}>
                  <p className="leading-relaxed">{m.text}</p>

                  {m.summary && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-1 text-xs">
                      {Object.entries(m.summary).map(([k, v]) => (
                        <div key={k} className="flex justify-between font-mono">
                          <span className="text-slate-500 dark:text-slate-400">{k}:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs animate-pulse">
                  AI
                </div>
                <span>Analyzing warehouse database...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Ask a question (e.g. What is total spend? Which department spent the most?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Official Complaint Submission Form (1 Col) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-600" />
              <span>Register Compliance Complaint</span>
            </h4>

            {compMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{compMsg}</span>
              </div>
            )}

            <form onSubmit={handleComplaintSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase mb-1">Issue Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Booking Policy Variance"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Complaint Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or policy complaint..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all"
              >
                Submit Official Complaint
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
            Official Support: <strong>complaints@travelintelligence.com</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, DollarSign, Plane, Ticket, Send, Bot, Mail, CheckCircle2, PlusCircle, LayoutDashboard, History, LogOut, ChevronRight, Wallet, PieChart, Copy, Sun, Moon
} from 'lucide-react';

export const EmployeePortal = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('emp-dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Expense claim state
  const [origin, setOrigin] = useState('Bengaluru');
  const [destination, setDestination] = useState('Boston');
  const [destCountry, setDestCountry] = useState('United States');
  const [issueDate, setIssueDate] = useState('2026-09-01');
  const [travelDate, setTravelDate] = useState('2026-09-15');
  const [returnDate, setReturnDate] = useState('2026-09-25');
  const [amount, setAmount] = useState('1500');
  const [currency, setCurrency] = useState('USD');
  const [cabinClass, setCabinClass] = useState('Business');
  const [requestMsg, setRequestMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI & Complaint state
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Travel Assistant. Ask me about your claim status, quarterly allowances, or travel policies.' }
  ]);
  const [compSubject, setCompSubject] = useState('');
  const [compDetails, setCompDetails] = useState('');
  const [compMsg, setCompMsg] = useState('');

  const empId = user?.employee_id || 'EMP-1002';
  const empName = user?.name || data?.employee_name || 'Priya Nair';

  const fetchPersonalData = () => {
    setLoading(true);
    axios.get(`/api/employees/${empId}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPersonalData();
  }, [user]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    setSubmitting(true);

    axios.post('/api/tickets/create', {
      employee_id: empId,
      origin_city: origin,
      origin_country: 'India',
      dest_city: destination,
      dest_country: destCountry,
      issue_date: issueDate,
      travel_date: travelDate,
      return_date: returnDate,
      amount: floatParse(amount),
      currency: currency,
      cabin_class: cabinClass,
      booking_channel: 'Employee Portal'
    })
    .then(res => {
      setRequestMsg(res.data.message);
      setSubmitting(false);
      fetchPersonalData();
    })
    .catch(() => {
      setRequestMsg('Failed to submit claim.');
      setSubmitting(false);
    });
  };

  const floatParse = (val) => {
    const p = parseFloat(val);
    return isNaN(p) ? 100.0 : p;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setQuery('');

    axios.post('/api/assistant/query', { query: userText })
      .then(res => {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.answer }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I ran into an error answering your question.' }]);
      });
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/assistant/complaint', {
      subject: compSubject,
      details: compDetails,
      submitted_by: `${empName} (${empId})`
    })
    .then(res => {
      setCompMsg(res.data.message);
      setCompSubject('');
      setCompDetails('');
    })
    .catch(() => setCompMsg('Failed to lodge complaint.'));
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText('complaints@travelintelligence.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Employee Portal...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Employee Navigation Bar */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            ET
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-white">Employee Travel Portal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Personal Allowance • Travel Claims • AI Assistance</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{empName}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{empId} • {data?.business_unit || 'Global Technology'}</p>
          </div>

          {/* Light / Dark Theme Selection Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('emp-dashboard')}
              className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'emp-dashboard' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('emp-claim')}
              className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'emp-claim' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4" />
                <span>Submit Claim</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('emp-tickets')}
              className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'emp-tickets' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4" />
                <span>History</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('emp-assistant')}
              className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'emp-assistant' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>

          {/* Footer Left Sign Out Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
            <button
              onClick={logout}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Center Main Tab View */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* TAB 1: Employee Dashboard */}
          {activeTab === 'emp-dashboard' && data && (
            <div className="space-y-6">
              {/* Top Personal KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Quarterly Allowance</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{data.quarterly_allowance_inr.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Fixed Corporate Limit</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl font-mono shadow-sm">
                    ₹
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Spent (YTD)</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{data.used_allowance_inr.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">{data.allowance_burn_pct}% Budget Utilized</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Remaining Balance</p>
                    <h3 className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">₹{data.remaining_allowance_inr.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Available for New Claims</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
                    <PieChart className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Bookings</p>
                    <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{data.numbers.total_bookings} Trips</h3>
                    <p className="text-xs text-purple-600 font-semibold mt-0.5">{data.numbers.flown_trips} Flown Trips</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Ticket className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Personal Travel Profile Summary</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {data.narrative_summary}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Submit Travel Claim */}
          {activeTab === 'emp-claim' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 max-w-2xl mx-auto">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submit New Travel Claim Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Routes directly to Manager Approval Desk for verification.</p>
              </div>

              {requestMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{requestMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Departure Origin City</label>
                    <input
                      type="text"
                      required
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Destination City</label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Destination Country</label>
                    <input
                      type="text"
                      required
                      value={destCountry}
                      onChange={(e) => setDestCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Cabin Class Category</label>
                    <select
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none"
                    >
                      <option value="Economy">Economy (Standard Domestic)</option>
                      <option value="Premium Economy">Premium Economy</option>
                      <option value="Business">Business (Lead/Director International)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Booking Date</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Departure Date</label>
                    <input
                      type="date"
                      required
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Return Date</label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estimated Fare Amount</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Currency Code</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="INR">INR (Indian Rupee ₹)</option>
                      <option value="USD">USD (US Dollar $)</option>
                      <option value="GBP">GBP (British Pound £)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting to Manager...' : 'Submit Claim Request to Manager'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: History */}
          {activeTab === 'emp-tickets' && data && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Personal Travel Booking History & Approval Status</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Ticket ID</th>
                      <th className="p-3">Travel Date</th>
                      <th className="p-3">Route (Origin → Destination)</th>
                      <th className="p-3 text-center">Approval Status</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                    {data.tickets.map((t) => (
                      <tr key={t.ticket_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{t.ticket_id}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{t.travel_date}</td>
                        <td className="p-3 text-slate-900 dark:text-white font-semibold">{t.origin} → {t.destination}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            t.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            (t.approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200')
                          }`}>
                            {t.approval_status}
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
          )}

          {/* TAB 4: AI Assistant */}
          {activeTab === 'emp-assistant' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Assistant */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[480px]">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>AI Assistant</span>
                </h4>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 font-medium text-xs">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl ${
                        m.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about travel policy, claims, or allowance limits..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Support Desk & Complaint Filing */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>Lodge Official Support Complaint</span>
                  </h4>

                  <button
                    onClick={copySupportEmail}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedEmail ? 'Copied Email!' : 'complaints@travelintelligence.com'}</span>
                  </button>
                </div>

                {compMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                    {compMsg}
                  </div>
                )}

                <form onSubmit={handleComplaintSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Issue Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flight booking discrepancy..."
                      value={compSubject}
                      onChange={(e) => setCompSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Detailed Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Provide complete details of your travel issue..."
                      value={compDetails}
                      onChange={(e) => setCompDetails(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>File Official Complaint</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, DollarSign, Plane, Ticket, Send, Bot, Mail, CheckCircle2, PlusCircle, LayoutDashboard, History, LogOut, ChevronRight, Wallet, PieChart, Copy, Sun, Moon, ShieldCheck, ShieldAlert, Calculator, FileCheck, AlertTriangle, LifeBuoy, Clock, ExternalLink
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

  // Policy Validator & Allowance Calculator State
  const [calcTripType, setCalcTripType] = useState('domestic'); // 'domestic', 'intl_long', 'intl_short'
  const [calcCabin, setCalcCabin] = useState('Economy');
  const [calcFlightCost, setCalcFlightCost] = useState(12000);
  const [calcHotelRate, setCalcHotelRate] = useState(6000);
  const [calcNights, setCalcNights] = useState(3);

  // Email Support & Complaint Desk State
  const [fromEmail, setFromEmail] = useState(user?.email || 'priya.nair@travelintelligence.com');
  const targetEmail = "pparker062005@gmail.com";
  const [compSubject, setCompSubject] = useState('');
  const [compDetails, setCompDetails] = useState('');
  const [compMsg, setCompMsg] = useState('');
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [lastDispatchedTicket, setLastDispatchedTicket] = useState(null);

  const empId = user?.employee_id || 'EMP-1002';
  const empName = user?.name || data?.employee_name || 'Priya Nair';
  const [fetchError, setFetchError] = useState(null);

  const fetchPersonalData = () => {
    setLoading(true);
    setFetchError(null);
    const targetId = user?.employee_id || 'EMP-1002';
    axios.get(`/api/employees/${targetId}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch employee data:', err);
        setFetchError(err.response?.data?.detail || 'Unable to connect to server');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPersonalData();
  }, [user?.employee_id]);

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

  const fetchComplaints = () => {
    axios.get('/api/assistant/complaints')
      .then(res => setComplaintHistory(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (activeTab === 'emp-assistant') {
      fetchComplaints();
    }
  }, [activeTab]);

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!compSubject.trim() || !compDetails.trim()) return;

    axios.post('/api/assistant/complaint', {
      subject: compSubject.trim(),
      details: compDetails.trim(),
      submitted_by: `${empName} (${empId})`,
      from_email: fromEmail.trim()
    })
    .then(res => {
      const ticketId = res.data.complaint_id || 'CMP-101';
      setCompMsg(res.data.message || `Ticket registered successfully: ${ticketId}`);
      
      const mailSubject = `[Corporate Travel Ticket ${ticketId}] ${compSubject.trim()}`;
      const mailBody = `From: ${fromEmail.trim() || empName}\nEmployee: ${empName} (${empId})\nDivision: ${data?.business_unit || 'Human Resources'}\nTicket Reference: ${ticketId}\n\nDetails:\n${compDetails.trim()}`;
      
      // Official Google Gmail Web Compose URL (guaranteed delivery via browser Gmail)
      const gmailUrl = res.data.gmail_compose_url || `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      
      // Auto-open Gmail Web compose in browser tab
      try {
        window.open(gmailUrl, '_blank');
      } catch (err) {}

      setLastDispatchedTicket({
        ticketId,
        subject: compSubject.trim(),
        gmailUrl,
        mailtoUrl
      });

      setCompSubject('');
      setCompDetails('');
      fetchComplaints();
    })
    .catch(() => {
      const mailSubject = `[Corporate Travel Query] ${compSubject.trim()}`;
      const mailBody = `From: ${fromEmail.trim()}\nEmployee: ${empName} (${empId})\n\nDetails:\n${compDetails.trim()}`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      
      try {
        window.open(gmailUrl, '_blank');
      } catch (err) {}

      setLastDispatchedTicket({
        ticketId: 'CMP-NEW',
        subject: compSubject.trim(),
        gmailUrl,
        mailtoUrl
      });
      setCompMsg(`Official email client opened targeting ${targetEmail}.`);
    });
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText(targetEmail);
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
                <ShieldCheck className="w-4 h-4" />
                <span>Support & Policy Desk</span>
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
          {fetchError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
              <span>{fetchError}</span>
              <button onClick={fetchPersonalData} className="px-3 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700">Retry</button>
            </div>
          )}

          {/* TAB 1: Employee Dashboard */}
          {activeTab === 'emp-dashboard' && (
            <div className="space-y-6">
              {/* Top Personal KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Quarterly Allowance</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{(data?.quarterly_allowance_inr ?? 180000).toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Fixed Corporate Limit</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl font-mono shadow-sm">
                    ₹
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Spent (YTD)</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{(data?.used_allowance_inr ?? 0).toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">{data?.allowance_burn_pct ?? 0}% Budget Utilized</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Remaining Balance</p>
                    <h3 className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">₹{(data?.remaining_allowance_inr ?? 180000).toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Available for New Claims</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
                    <PieChart className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Bookings</p>
                    <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{data?.numbers?.total_bookings ?? 0} Trips</h3>
                    <p className="text-xs text-purple-600 font-semibold mt-0.5">{data?.numbers?.flown_trips ?? 0} Flown Trips</p>
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
                  {data?.narrative_summary || `${empName} (${empId}) is assigned to ${data?.business_unit || 'Global Technology'} with active quarterly travel allowances.`}
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
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{requestMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('emp-tickets')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] whitespace-nowrap shadow-sm"
                  >
                    View in History →
                  </button>
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
          {activeTab === 'emp-tickets' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Personal Travel Booking History & Approval Status</span>
              </h4>

              {(!data?.tickets || data.tickets.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                  No travel bookings recorded yet for this account. Use <strong>Submit Claim</strong> to request a new travel ticket.
                </div>
              ) : (
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
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{(t.amount_inr ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Corporate Support & Travel Policy Desk */}
          {activeTab === 'emp-assistant' && (
            <div className="space-y-6">
              {/* Top Banner Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-indigo-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Corporate Support Desk & Travel Policy Engine</h4>
                    <p className="text-xs text-indigo-200">100% In-House Policy Calculations • Direct Email Dispatch to {targetEmail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copySupportEmail}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all cursor-pointer self-start sm:self-center"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>{targetEmail}</span>
                  <Copy className="w-3 h-3 text-amber-400 ml-1" />
                  {copiedEmail && <span className="text-amber-400 font-bold text-[10px] ml-1">(Copied!)</span>}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Pre-Booking Travel Policy Validator & Allowance Calculator */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span>Pre-Booking Policy Validator & Calculator</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      Rule Engine
                    </span>
                  </div>

                  {/* Calculator Inputs */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Trip Classification & Duration
                      </label>
                      <select
                        value={calcTripType}
                        onChange={(e) => setCalcTripType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="domestic">Domestic Flight (Within India)</option>
                        <option value="intl_long">Cross-Border International (&gt;6 Hours Duration)</option>
                        <option value="intl_short">Short International Flight (≤6 Hours Duration)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Flight Cabin Class
                        </label>
                        <select
                          value={calcCabin}
                          onChange={(e) => setCalcCabin(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="Economy">Economy Class</option>
                          <option value="Business">Business Class</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Flight Cost (₹ INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={calcFlightCost}
                          onChange={(e) => setCalcFlightCost(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Hotel Rate / Night (₹ INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={calcHotelRate}
                          onChange={(e) => setCalcHotelRate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Policy Cap: {calcTripType === 'domestic' ? '₹8,500 INR' : '₹21,250 ($250 USD)'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Duration (Nights)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={calcNights}
                          onChange={(e) => setCalcNights(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Per Diem: {calcTripType === 'domestic' ? '₹1,800/day' : '₹6,375 ($75)/day'}
                        </span>
                      </div>
                    </div>

                    {/* Policy Compliance Results & Warnings */}
                    <div className="space-y-2 pt-2">
                      {calcTripType === 'domestic' && calcCabin === 'Business' && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">POLICY VIOLATION: </span>
                            Domestic flights are strictly restricted to Economy Class. Business Class requests will be rejected by the Manager Desk.
                          </div>
                        </div>
                      )}

                      {calcTripType === 'intl_short' && calcCabin === 'Business' && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">POLICY VARIANCE: </span>
                            Business Class on short international flights (≤6 hrs) requires VP approval and pre-booking exception justification.
                          </div>
                        </div>
                      )}

                      {(parseFloat(calcHotelRate) || 0) > (calcTripType === 'domestic' ? 8500 : 21250) && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">HOTEL CAP EXCEEDED: </span>
                            The night rate of ₹{parseFloat(calcHotelRate).toLocaleString('en-IN')} exceeds the corporate accommodation ceiling of {calcTripType === 'domestic' ? '₹8,500' : '₹21,250'}.
                          </div>
                        </div>
                      )}

                      {!(calcTripType === 'domestic' && calcCabin === 'Business') &&
                       !((parseFloat(calcHotelRate) || 0) > (calcTripType === 'domestic' ? 8500 : 21250)) && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-medium">All Corporate Policy Thresholds Satisfied.</span>
                        </div>
                      )}
                    </div>

                    {/* Spend Estimation Summary vs Quarterly Allowance */}
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Estimated Total Trip Cost:</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          ₹{( (parseFloat(calcFlightCost) || 0) + ((parseFloat(calcHotelRate) || 0) * (parseInt(calcNights) || 0)) + ((calcTripType === 'domestic' ? 1800 : 6375) * (parseInt(calcNights) || 0)) ).toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Remaining Quarterly Allowance:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{Math.max(0, (data?.quarterly_allowance_inr || 150000) - (data?.flown_spend_inr || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR
                        </span>
                      </div>
                      {((parseFloat(calcFlightCost) || 0) + ((parseFloat(calcHotelRate) || 0) * (parseInt(calcNights) || 0)) + ((calcTripType === 'domestic' ? 1800 : 6375) * (parseInt(calcNights) || 0))) > Math.max(0, (data?.quarterly_allowance_inr || 150000) - (data?.flown_spend_inr || 0)) ? (
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                          ⚠ Estimated cost exceeds remaining quarterly allowance by ₹{( ((parseFloat(calcFlightCost) || 0) + ((parseFloat(calcHotelRate) || 0) * (parseInt(calcNights) || 0)) + ((calcTripType === 'domestic' ? 1800 : 6375) * (parseInt(calcNights) || 0))) - Math.max(0, (data?.quarterly_allowance_inr || 150000) - (data?.flown_spend_inr || 0)) ).toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR. Manager exception override required.
                        </div>
                      ) : (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                          ✓ Sufficient quarterly allowance balance available for this trip.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Official Email Support Dispatcher & Complaint Desk */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-600" />
                        <span>Direct Email Support & Complaint Desk</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Official Desk
                      </span>
                    </div>

                    {compMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{compMsg}</span>
                      </div>
                    )}

                    {lastDispatchedTicket && (
                      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Ticket {lastDispatchedTicket.ticketId} Registered
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            Target: {targetEmail}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          Your ticket is registered in the database. Click below to open Gmail and send the pre-filled official query directly to <strong>{targetEmail}</strong>:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <a
                            href={lastDispatchedTicket.gmailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Open Gmail Web & Send</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                          <a
                            href={lastDispatchedTicket.mailtoUrl}
                            className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>Open in Outlook / Mail</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleComplaintSubmit} className="space-y-3 text-xs">
                      {/* From Email Input (Editable if employee signed in without corporate email) */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          From (Your Email)
                        </label>
                        <input
                          type="email"
                          required
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                        />
                      </div>

                      {/* To Email Field (Fixed Official Email pparker062005@gmail.com) */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          To (Official Corporate Dispatch)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={targetEmail}
                            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none cursor-default"
                          />
                          <span className="absolute right-3 top-2 text-[10px] uppercase font-bold text-slate-400">
                            Verified
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Subject / Ticket Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Travel Policy Query / Exception Approval Request"
                          value={compSubject}
                          onChange={(e) => setCompSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                        />
                      </div>

                      {/* Detailed Description */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Draft Message / Complaint Details
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Describe your issue, travel query, or policy exception justification..."
                          value={compDetails}
                          onChange={(e) => setCompDetails(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Official Email & Lodge Complaint</span>
                      </button>
                    </form>
                  </div>

                  {/* Live Ticket Status Ledger */}
                  {complaintHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Recent Lodged Tickets ({complaintHistory.length})
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {complaintHistory.slice(0, 4).map((c, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono mr-2">{c.ticket_id}</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px] inline-block align-bottom">{c.subject}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

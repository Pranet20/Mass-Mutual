import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, UserPlus, Trash2, Eye, Upload, CheckCircle2, AlertCircle, FileSpreadsheet, User, ShieldAlert, Filter, Layers, Users } from 'lucide-react';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';

export const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'ALLOCATED', 'NULL'
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState('csv'); // 'single' or 'csv'
  const [notificationMsg, setNotificationMsg] = useState('');

  // Single Employee Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bu, setBu] = useState('Global Technology');
  const [dept, setDept] = useState('Software Engineering');
  const [designation, setDesignation] = useState('Senior Engineer');
  const [location, setLocation] = useState('Bengaluru');

  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchEmployees = () => {
    setLoading(true);
    axios.get('/api/employees')
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = (e) => {
    e.preventDefault();
    axios.post('/api/employees', {
      employee_name: name,
      email: email,
      business_unit: bu,
      department: dept,
      designation: designation,
      location: location
    })
    .then(res => {
      setNotificationMsg(res.data.message || 'Employee created successfully!');
      setShowAddModal(false);
      setName('');
      setEmail('');
      fetchEmployees();
    });
  };

  const handleCSVUpload = (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const formData = new FormData();
    formData.append('file', csvFile);

    setUploading(true);
    axios.post('/api/employees/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => {
      setNotificationMsg(res.data.message);
      setUploading(false);
      setShowAddModal(false);
      setCsvFile(null);
      fetchEmployees();
    })
    .catch(() => {
      setNotificationMsg('Failed to process CSV dataset file.');
      setUploading(false);
    });
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm(`Delete employee ${id}?`)) {
      axios.delete(`/api/employees/${id}`)
        .then(() => fetchEmployees());
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      e.business_unit.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterType === 'ALLOCATED') return !e.is_allowance_null;
    if (filterType === 'NULL') return e.is_allowance_null;
    return true;
  });

  const nullCount = employees.filter(e => e.is_allowance_null).length;
  const allocatedCount = employees.filter(e => !e.is_allowance_null).length;

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Corporate Employee Directory & Dataset Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage Verified Corporate Employees, Income Allowances & Governed Data Quality Rules</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee / Import CSV</span>
        </button>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Corporate Headcount</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{employees.length} Employees</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Active Master Records</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Standard Allocated Budget</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{allocatedCount} Profiles</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">100% Validated Allowances</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Unallocated / Null Records</p>
            <h3 className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5">{nullCount} Records</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Graceful Null-Safety Handled</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {notificationMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationMsg}</span>
          </div>
          <button type="button" onClick={() => setNotificationMsg('')} className="text-xs font-bold text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID, Business Unit, or Department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
          />
        </div>

        {/* Filter Slicer Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Employees ({employees.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('ALLOCATED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'ALLOCATED'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Allocated ({allocatedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('NULL')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'NULL'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Null Allowance Audit ({nullCount})</span>
          </button>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-3.5">Employee ID & Name</th>
                <th className="p-3.5">Division & Dept</th>
                <th className="p-3.5">Designation & Location</th>
                <th className="p-3.5 text-right">Quarterly Allowance</th>
                <th className="p-3.5 text-right">Flown Spend (INR)</th>
                <th className="p-3.5 text-center font-mono">Flown Trips</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading Directory...</td></tr>
              ) : filteredEmployees.map((e) => (
                <tr key={e.employee_id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${e.is_allowance_null ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{e.employee_name}</span>
                      {e.is_allowance_null && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          Null Allowance
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{e.employee_id}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{e.business_unit}</div>
                    <div className="text-slate-500 text-[11px]">{e.department}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-800 dark:text-slate-200">{e.designation}</div>
                    <div className="text-slate-400 text-[11px]">{e.location}</div>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold">
                    {e.is_allowance_null ? (
                      <span className="text-amber-600 dark:text-amber-400 italic">NULL (Unassigned)</span>
                    ) : (
                      <span className="text-slate-900 dark:text-white">₹{e.quarterly_allowance_inr?.toLocaleString('en-IN')}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{e.total_spend_inr.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                    {e.flown_trips} Trips
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEmpId(e.employee_id)}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(e.employee_id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Employee Detail Modal */}
      {selectedEmpId && (
        <EmployeeDetailModal
          employeeId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
          onAllowanceUpdated={() => fetchEmployees()}
        />
      )}

      {/* Add Employee / Import CSV Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Add Corporate Employee / Import Dataset</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('csv')}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 ${
                  modalTab === 'csv'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload CSV Dataset</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('single')}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 ${
                  modalTab === 'single'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Create Single Profile</span>
              </button>
            </div>

            {/* Tab 1: CSV Upload */}
            {modalTab === 'csv' && (
              <form onSubmit={handleCSVUpload} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Employee Directory CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="w-full text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !csvFile}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                  >
                    {uploading ? 'Processing Dataset...' : 'Import Dataset'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Single Form */}
            {modalTab === 'single' && (
              <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shalini Roy"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. shalini.roy@travelintelligence.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Business Division</label>
                    <select
                      value={bu}
                      onChange={(e) => setBu(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Global Technology">Global Technology</option>
                      <option value="Finance & Actuarial">Finance & Actuarial</option>
                      <option value="Operations & Risk">Operations & Risk</option>
                      <option value="Executive Leadership">Executive Leadership</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Office Location</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Save Employee Profile
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

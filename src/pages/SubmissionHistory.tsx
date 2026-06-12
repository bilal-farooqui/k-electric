import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle,
  Clock,
  FileText,
  ShieldAlert,
  ChevronRight,
  Search,
  Calendar,
} from 'lucide-react';
import type { Permit, UserProfile } from '../types/ptw';

interface SubmissionHistoryProps {
  currentUser: UserProfile;
  permits: Permit[];
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ currentUser, permits }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter permits belonging to this employee
  const employeePermits = permits.filter((permit) => {
    const isCreatorByUsername = permit.formData?.submittedByUsername === currentUser.username;
    const isCreatorByName = permit.submittedBy === currentUser.name;
    return isCreatorByUsername || isCreatorByName;
  });

  // Apply search term and status filters
  const filteredPermits = employeePermits.filter((permit) => {
    const matchesSearch = 
      permit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && permit.status.toUpperCase() === statusFilter;
  });

  // Calculate quick stats for this employee's permits
  const total = employeePermits.length;
  const approved = employeePermits.filter((p) => p.status === 'APPROVED').length;
  const pending = employeePermits.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const draft = employeePermits.filter((p) => p.status === 'DRAFT').length;
  const rejected = employeePermits.filter((p) => p.status === 'REJECTED').length;

  const ptwForms = [
    { name: 'Vehicle Inspection Checklist', path: '/vehicle-inspection', code: 'KE-PTW-VI-01' },
    { name: 'Tools & PPE Checklist', path: '/tools-ppe', code: 'KE-PTW-TP-02' },
    { name: 'Shift Dispatching Checklist', path: '/shift-dispatch', code: 'KE-PTW-SD-03' },
    { name: 'Site TBT (Toolbox Talk)', path: '/toolbox-talk', code: 'KE-PTW-TBT-04' },
    { name: 'Receiving Fault & Excavation Request', path: '/fault-excavation', code: 'KE-PTW-FE-05' },
    { name: 'Line Isolation PTW', path: '/line-isolation', code: 'KE-PTW-LI-06' },
    { name: 'Excavation PTW', path: '/excavation', code: 'KE-PTW-EX-07' },
    { name: 'Confined Space PTW', path: '/confined-space', code: 'KE-PTW-CS-08' },
    { name: 'Heat Shrink PTW', path: '/heat-shrink', code: 'KE-PTW-HS-09' },
  ];

  const getFormName = (type: string) => {
    const item = ptwForms.find((f) => f.path.includes(type));
    return item ? item.name : type.replace('-', ' ');
  };

  const getFormPath = (type: string) => {
    const item = ptwForms.find((f) => f.path.includes(type));
    return item ? item.path : '/';
  };

  const handleRowClick = (permit: Permit) => {
    const path = getFormPath(permit.type);
    navigate(`${path}?id=${permit.id}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy font-display">
            My Submitted Permits
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Track and review your Permit-to-Work safety sheets, drafts, and active authorizations.
          </p>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-24">
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-wider block">My Total Permits</span>
            <span className="text-xl font-extrabold text-brand-navy mt-1 font-display block">{total}</span>
          </div>
          <div className="absolute right-3.5 top-3.5 bg-gray-50 p-1.5 rounded-lg text-gray-400">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-24">
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Active & Approved</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 font-display block">{approved}</span>
          </div>
          <div className="absolute right-3.5 top-3.5 bg-emerald-50 p-1.5 rounded-lg text-emerald-500">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-24">
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Awaiting Sign-off</span>
            <span className="text-xl font-extrabold text-amber-500 mt-1 font-display block">{pending}</span>
          </div>
          <div className="absolute right-3.5 top-3.5 bg-amber-50 p-1.5 rounded-lg text-amber-500">
            <Clock className="h-4.5 w-4.5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-24">
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Draft Permits</span>
            <span className="text-xl font-extrabold text-gray-600 mt-1 font-display block">{draft}</span>
          </div>
          <div className="absolute right-3.5 top-3.5 bg-gray-50 p-1.5 rounded-lg text-gray-400">
            <FileText className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-24 col-span-2 md:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Rejected Checklists</span>
            <span className="text-xl font-extrabold text-red-650 mt-1 font-display block">{rejected}</span>
          </div>
          <div className="absolute right-3.5 top-3.5 bg-red-50 p-1.5 rounded-lg text-red-500">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Table & Controls wrapper */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3.5 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto select-none shrink-0 py-0.5">
            {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-brand-navy border-brand-navy text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-650 hover:bg-gray-50'
                }`}
              >
                {filter === 'ALL'
                  ? 'All Permits'
                  : filter === 'PENDING_APPROVAL'
                  ? 'Pending Review'
                  : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Permits Table */}
        {filteredPermits.length === 0 ? (
          <div className="p-10 text-center">
            <FileSpreadsheet className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 italic">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No permits matched your active search filters.'
                : 'You have not submitted or saved any safety permits yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b border-gray-200 tracking-wider">
                  <th className="px-5 py-3">Permit ID</th>
                  <th className="px-5 py-3">Form Description</th>
                  <th className="px-5 py-3">Created Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredPermits.map((permit) => {
                  const statusColors: Record<string, string> = {
                    DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
                    PENDING_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-300',
                    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    REJECTED: 'bg-red-100 text-red-800 border-red-300',
                    draft: 'bg-gray-100 text-gray-800 border-gray-305',
                    pending: 'bg-amber-100 text-amber-800 border-amber-305',
                    approved: 'bg-emerald-100 text-emerald-800 border-emerald-305',
                    rejected: 'bg-red-100 text-red-800 border-red-305',
                  };

                  const displayStatus = (permit.status || '')
                    .toUpperCase()
                    .replace('PENDING_APPROVAL', 'PENDING REVIEW')
                    .replace('_', ' ');

                  return (
                    <tr
                      key={permit.id}
                      onClick={() => handleRowClick(permit)}
                      className="hover:bg-gray-50/55 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-brand-navy">{permit.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-brand-navy">{getFormName(permit.type)}</div>
                        <div className="text-[9px] font-mono text-gray-400 mt-0.5">
                          {ptwForms.find((f) => f.path.includes(permit.type))?.code || 'KE-PTW'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {permit.createdAt}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full ${statusColors[permit.status] || 'bg-gray-100 text-gray-800'}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="text-[10px] bg-white border border-gray-300 hover:bg-gray-55 text-gray-700 px-2.5 py-1 rounded-md font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          View Form <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

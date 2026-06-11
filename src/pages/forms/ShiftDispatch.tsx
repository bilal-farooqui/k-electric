import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { Permit } from '../../types/ptw';

interface FormProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: any;
}

export const ShiftDispatch: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-SD-03';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [officerInCharge, setOfficerInCharge] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [faultDateTime, setFaultDateTime] = useState('');
  const [faultForwardedBy, setFaultForwardedBy] = useState('');

  const [address, setAddress] = useState('');
  const [faultLocation, setFaultLocation] = useState('');
  const [natureOfFault, setNatureOfFault] = useState('');

  const [attendedBy, setAttendedBy] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');

  const [workDone, setWorkDone] = useState('');
  const [materialIssued, setMaterialIssued] = useState('');
  const [materialReturned, setMaterialReturned] = useState('');

  const [officerSignature, setOfficerSignature] = useState('');
  const [ugmClearance, setUgmClearance] = useState('');

  // Load existing data if editId is provided
  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setOfficerInCharge(data.officerInCharge || '');
        setDate(data.date || '');
        setFaultDateTime(data.faultDateTime || '');
        setFaultForwardedBy(data.faultForwardedBy || '');
        setAddress(data.address || '');
        setFaultLocation(data.faultLocation || '');
        setNatureOfFault(data.natureOfFault || '');
        setAttendedBy(data.attendedBy || '');
        setDispatchTime(data.dispatchTime || '');
        setWorkDone(data.workDone || '');
        setMaterialIssued(data.materialIssued || '');
        setMaterialReturned(data.materialReturned || '');
        setOfficerSignature(data.officerSignature || '');
        setUgmClearance(data.ugmClearance || '');
      }
    } else {
      setPermitId(`KE-SD-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setOfficerInCharge(currentUser?.name || '');
      setDate(new Date().toISOString().split('T')[0]);
      // Set current datetime as default
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFaultDateTime(localISO);
      setFaultForwardedBy('');
      setAddress('');
      setFaultLocation('');
      setNatureOfFault('');
      setAttendedBy('');
      // Set current time as default format HH:MM
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      setDispatchTime(`${HH}:${MM}`);
      setWorkDone('');
      setMaterialIssued('');
      setMaterialReturned('');
      setOfficerSignature('');
      setUgmClearance('');
    }
  }, [permits, editId, currentUser]);

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'shift-dispatch',
      title: 'Shift Dispatching Checklist',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: officerInCharge,
      formData: {
        officerInCharge,
        date,
        faultDateTime,
        faultForwardedBy,
        address,
        faultLocation,
        natureOfFault,
        attendedBy,
        dispatchTime,
        workDone,
        materialIssued,
        materialReturned,
        officerSignature,
        ugmClearance,
      },
    };

    const index = permits.findIndex((p) => p.id === permitId);
    let updated: Permit[];
    if (index > -1) {
      updated = [...permits];
      updated[index] = newPermit;
    } else {
      updated = [newPermit, ...permits];
    }

    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
    alert('Draft saved successfully!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!officerInCharge || !date || !faultDateTime || !faultForwardedBy || !address || !faultLocation || !natureOfFault || !attendedBy || !dispatchTime) {
      alert('Please fill out all the mandatory fields under Main, Fault, and Team Details.');
      return;
    }

    if (!officerSignature) {
      alert('Officer In-Charge signature is required to submit.');
      return;
    }

    const finalStatus = ugmClearance ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'shift-dispatch',
      title: 'Shift Dispatching Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: officerInCharge,
      approvedBy: finalStatus === 'approved' ? 'Utility Grid Manager' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        officerInCharge,
        date,
        faultDateTime,
        faultForwardedBy,
        address,
        faultLocation,
        natureOfFault,
        attendedBy,
        dispatchTime,
        workDone,
        materialIssued,
        materialReturned,
        officerSignature,
        ugmClearance,
      },
    };

    const index = permits.findIndex((p) => p.id === permitId);
    let updated: Permit[];
    if (index > -1) {
      updated = [...permits];
      updated[index] = newPermit;
    } else {
      updated = [newPermit, ...permits];
    }

    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
    setStatus(finalStatus);
    alert(
      finalStatus === 'approved'
        ? 'Shift dispatch checklist approved and finalized!'
        : 'Shift dispatch checklist submitted. Awaiting UGM clearance.'
    );
    navigate('/');
  };

  const handleApprove = () => {
    if (!ugmClearance && status === 'pending') {
      alert('UGM Clearance signature is required under CLOSURE to approve.');
      return;
    }
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'UGM'} (${currentUser?.role || 'Utility Grid Manager'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        ugmClearance,
      }
    };
    const index = permits.findIndex((p) => p.id === permitId);
    let updated = [...permits];
    if (index > -1) {
      updated[index] = updatedPermit;
    } else {
      updated = [updatedPermit, ...permits];
    }
    onSetPermits(updated);
    setStatus('approved');
    alert('Permit approved and closed successfully!');
    navigate('/admin');
  };

  const handleReject = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'rejected',
      approvedBy: `${currentUser?.name || 'UGM'} (${currentUser?.role || 'Utility Grid Manager'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        ugmClearance,
      }
    };
    const index = permits.findIndex((p) => p.id === permitId);
    let updated = [...permits];
    if (index > -1) {
      updated[index] = updatedPermit;
    } else {
      updated = [updatedPermit, ...permits];
    }
    onSetPermits(updated);
    setStatus('rejected');
    alert('Permit rejected.');
    navigate('/admin');
  };

  const isAuthorizerDisabled = status === 'approved' || status === 'rejected' || currentUser?.role !== 'Principal Safety Officer';
  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  const existingPermit = permits.find((p) => p.id === permitId);
  const approvedByVal = existingPermit?.approvedBy || (status === 'pending' && currentUser?.role === 'Principal Safety Officer' ? `${currentUser?.name} (${currentUser?.role || 'Utility Grid Manager'})` : 'Awaiting Clearance');
  const approvedAtVal = existingPermit?.approvedAt || (status === 'pending' && currentUser?.role === 'Principal Safety Officer' ? new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() : 'Pending Review');

  return (
    <FormWrapper
      title="3. SHIFT DISPATCHING CHECKLIST PTW"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: MAIN INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          MAIN INFORMATION
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">OFFICER IN-CHARGE</label>
            <input
              type="text"
              required
              value={officerInCharge}
              onChange={(e) => setOfficerInCharge(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DATE</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT DATE/TIME</label>
            <input
              type="datetime-local"
              required
              value={faultDateTime}
              onChange={(e) => setFaultDateTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT FORWARDED BY</label>
            <input
              type="text"
              required
              value={faultForwardedBy}
              onChange={(e) => setFaultForwardedBy(e.target.value)}
              placeholder="e.g. Call Center / FSC"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: FAULT DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          FAULT DETAILS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-550 block mb-1">ADDRESS</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block 4, Clifton, near BBQ Tonight"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT LOCATION</label>
            <input
              type="text"
              required
              value={faultLocation}
              onChange={(e) => setFaultLocation(e.target.value)}
              placeholder="e.g. Feeder Pillars / Pole 4"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold text-gray-550 block mb-1">NATURE OF FAULT</label>
            <input
              type="text"
              required
              value={natureOfFault}
              onChange={(e) => setNatureOfFault(e.target.value)}
              placeholder="e.g. Overhead line snapped, cable insulation breakdown"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 3: TEAM DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          TEAM DETAILS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">ATTENDED BY</label>
            <input
              type="text"
              required
              value={attendedBy}
              onChange={(e) => setAttendedBy(e.target.value)}
              placeholder="e.g. Crew A (Lead Lineman Arif Khan + 4 technicians)"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DISPATCH TIME</label>
            <input
              type="time"
              required
              value={dispatchTime}
              onChange={(e) => setDispatchTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 4: WORK DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          WORK DETAILS
        </h3>
        
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-555 block mb-1">DETAIL OF WORK DONE</label>
            <textarea
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              placeholder="Describe jointing details, line restrings, or specific works completed..."
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-555 block mb-1">MATERIAL ISSUED</label>
              <textarea
                value={materialIssued}
                onChange={(e) => setMaterialIssued(e.target.value)}
                placeholder="e.g. 10m XLPE Cable 11kV, 1x Raychem Joint Kit, 2x Cable Sleeves"
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
                disabled={isDisabled}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-555 block mb-1">MATERIAL RETURNED</label>
              <textarea
                value={materialReturned}
                onChange={(e) => setMaterialReturned(e.target.value)}
                placeholder="e.g. 3m scrap copper conductor, unused cable sleeves"
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* OFFICER SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          OFFICER SIGN-OFF
        </h3>
        <div className="max-w-md">
          <SignaturePad
            label="OFFICER IN-CHARGE SIGNATURE"
            role="Officer In-Charge"
            onSign={setOfficerSignature}
            savedSignature={officerSignature}
            disabled={isDisabled}
          />
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: CLOSURE */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          CLOSURE
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-555 block mb-1">CLEARED BY (UGM)</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedByVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-555 block mb-1">CLEARANCE TIME</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedAtVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-555 block mb-1">CLEARANCE STATUS</label>
            <div className={`w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase h-[38px] flex items-center justify-center gap-1.5 ${
              status === 'approved' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : status === 'rejected' 
                ? 'bg-red-50 border-red-300 text-red-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
            }`}>
              {status === 'approved' ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> DISPATCH CLEARED
                </>
              ) : status === 'rejected' ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-red-650" /> CLEARANCE REJECTED
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" /> AWAITING UGM CLEARANCE
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <SignaturePad
            label="CLEARANCE BY UGM"
            role="Utility Grid Manager"
            onSign={setUgmClearance}
            savedSignature={ugmClearance}
            disabled={isAuthorizerDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

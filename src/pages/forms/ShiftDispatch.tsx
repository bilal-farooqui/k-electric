import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
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
  const [dispatcherName, setDispatcherName] = useState('');
  const [shiftType, setShiftType] = useState('Morning (06:00 - 14:00)');
  const [zone, setZone] = useState('DHA Subdivision Zone 3');
  const [crewSize, setCrewSize] = useState('6');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    tbtCompleted: false,
    emergencyContacts: false,
    isolationConfirmed: false,
    vehicleInspected: false,
    weatherChecked: false,
    radioTested: false,
  });
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setDispatcherName(data.dispatcherName || '');
        setShiftType(data.shiftType || 'Morning (06:00 - 14:00)');
        setZone(data.zone || '');
        setCrewSize(data.crewSize || '');
        setDispatchDate(data.dispatchDate || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
      }
    } else {
      setPermitId(`KE-SD-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setDispatcherName(currentUser?.name || '');
      setShiftType('Morning (06:00 - 14:00)');
      setZone('DHA Subdivision Zone 3');
      setCrewSize('6');
      setDispatchDate(new Date().toISOString().split('T')[0]);
      setChecklist({
        tbtCompleted: false,
        emergencyContacts: false,
        isolationConfirmed: false,
        vehicleInspected: false,
        weatherChecked: false,
        radioTested: false,
      });
      setSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'shift-dispatch',
      title: 'Shift Dispatching Checklist',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: dispatcherName,
      formData: {
        dispatcherName,
        shiftType,
        zone,
        crewSize,
        dispatchDate,
        checklist,
        signature,
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

    if (!dispatcherName || !zone) {
      alert('Please fill out all dispatch information fields.');
      return;
    }

    if (!signature) {
      alert('A digital signature or authorization stamp is required to dispatch.');
      return;
    }

    const allChecked = Object.values(checklist).every((val) => val === true);
    const finalStatus = allChecked ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'shift-dispatch',
      title: 'Shift Dispatching Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: dispatcherName,
      approvedBy: finalStatus === 'approved' ? 'Shift Dispatch In-Charge' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        dispatcherName,
        shiftType,
        zone,
        crewSize,
        dispatchDate,
        checklist,
        signature,
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
      allChecked
        ? 'Shift dispatched successfully!'
        : 'Warning: Missing critical pre-dispatch verifications. Marked as Pending Sign-off.'
    );
    navigate('/');
  };

  const handleApprove = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
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
    alert('Permit approved successfully!');
    navigate('/admin');
  };

  const handleReject = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'rejected',
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

  const items = [
    { key: 'tbtCompleted', label: 'Toolbox Talk (TBT) Signed by Crew', tooltip: 'Verify on-site risk talk was conducted and signed by all crew.' },
    { key: 'emergencyContacts', label: 'Emergency Contact Directory Issued', tooltip: 'Ensure the crew has the central control room and emergency helpline numbers.' },
    { key: 'isolationConfirmed', label: 'Line Isolation & Earth Check Approved', tooltip: 'Confirm that the feeder isolation switch has been opened and grounded before dispatch.' },
    { key: 'vehicleInspected', label: 'Vehicle Safety Checklist Completed', tooltip: 'Verify that the truck inspection report is signed and valid for this shift.' },
    { key: 'weatherChecked', label: 'Local Meteorological / Weather Clearance', tooltip: 'Check forecast for high winds (>20 knots) or lightning risk before deploying bucket trucks.' },
    { key: 'radioTested', label: 'VHF Handset / Radio Signal Checked', tooltip: 'Confirm voice clarity on radio channels 1 and 4 with the dispatch station.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Shift Dispatch Control Checklist"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Shift Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DISPATCHER IN-CHARGE</label>
            <input
              type="text"
              value={dispatcherName}
              onChange={(e) => setDispatcherName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">SHIFT ROTATION</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option>Morning (06:00 - 14:00)</option>
              <option>Evening (14:00 - 22:00)</option>
              <option>Night (22:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">OPERATIONAL SUBDIVISION / ZONE</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CREW COUNT</label>
            <input
              type="number"
              value={crewSize}
              onChange={(e) => setCrewSize(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DISPATCH DATE</label>
            <input
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Dispatch Safety Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4.5 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <button
                type="button"
                onClick={() => toggleCheck(item.key)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  checklist[item.key]
                    ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                    : 'bg-gray-105 border border-gray-300 text-gray-650 hover:bg-gray-200'
                }`}
              >
                {checklist[item.key] ? 'Confirmed' : 'Pending'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Dispatch Clearance Sign-Off
        </h3>

        <div className="max-w-md">
          <SignaturePad
            label="DISPATCH CONTROL ROOM STAMP"
            role="Control Room Shift Engineer"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Permit, PermitStatus } from '../../types/ptw';

interface FormProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: any;
}

export const VehicleInspection: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-VI-01';
  
  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchTime, setDispatchTime] = useState('');
  const [damageObservation, setDamageObservation] = useState('');
  const [signature, setSignature] = useState('');
  const [checklist, setChecklist] = useState<Record<string, 'good' | 'damaged'>>({
    headlights: 'good',
    indicators: 'good',
    horn: 'good',
    tires: 'good',
    fuel: 'good',
    brakes: 'good',
    extinguisher: 'good',
    firstaid: 'good',
    seatbelts: 'good',
  });

  // Load existing data if editId is provided
  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setVehicleNo(data.vehicleNo || '');
        setDriverName(data.driverName || '');
        setSupervisorName(data.supervisorName || '');
        setDate(data.date || '');
        setDispatchTime(data.dispatchTime || '');
        setDamageObservation(data.damageObservation || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-VI-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setVehicleNo('');
      setDriverName(currentUser?.name || '');
      setSupervisorName('');
      setDate(new Date().toISOString().split('T')[0]);
      // Set current time as default format HH:MM
      const now = new Date();
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      setDispatchTime(`${HH}:${MM}`);
      setDamageObservation('');
      setChecklist({
        headlights: 'good',
        indicators: 'good',
        horn: 'good',
        tires: 'good',
        fuel: 'good',
        brakes: 'good',
        extinguisher: 'good',
        firstaid: 'good',
        seatbelts: 'good',
      });
      setSignature('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string, val: 'good' | 'damaged') => {
    setChecklist((prev) => ({ ...prev, [item]: val }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'vehicle-inspection',
      title: 'Vehicle Inspection Checklist',
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: driverName,
      formData: {
        vehicleNo,
        driverName,
        supervisorName,
        date,
        dispatchTime,
        damageObservation,
        checklist,
        signature,
        approverSignature,
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

    if (!vehicleNo || !driverName || !supervisorName || !date || !dispatchTime) {
      alert('Please fill out all basic information details.');
      return;
    }

    if (!signature) {
      alert('A digital driver signature is required to submit.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      id: permitId,
      type: 'vehicle-inspection',
      title: 'Vehicle Inspection Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: driverName,
      formData: {
        vehicleNo,
        driverName,
        supervisorName,
        date,
        dispatchTime,
        damageObservation,
        checklist,
        signature,
        approverSignature,
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
    alert('Permit submitted successfully and is now pending safety officer review.');
    navigate('/');
  };

  const handleApprove = (approverSig: string) => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'APPROVED',
      approvedBy: `${currentUser?.name || 'Supervisor'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
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
    setStatus('APPROVED');
    setApproverSignature(approverSig);
    alert('Permit approved successfully by Supervisor!');
    navigate('/admin');
  };

  const handleReject = (approverSig: string) => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'REJECTED',
      approvedBy: `${currentUser?.name || 'Supervisor'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
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
    setStatus('REJECTED');
    setApproverSignature(approverSig);
    alert('Permit rejected.');
    navigate('/admin');
  };

  const items = [
    { key: 'headlights', label: 'Headlights Working', tooltip: 'Verify both headlights and high/low beams are operational.' },
    { key: 'indicators', label: 'Indicators Working', tooltip: 'Test left, right, hazard lights, and side blinkers.' },
    { key: 'horn', label: 'Horn Working', tooltip: 'Check that the horn responds clearly.' },
    { key: 'tires', label: 'Tire Condition OK', tooltip: 'Check that tires have adequate tread and no visible cuts or low pressure.' },
    { key: 'fuel', label: 'Fuel Sufficient', tooltip: 'Verify fuel level indicator is sufficient for the shift.' },
    { key: 'brakes', label: 'Brakes Functioning', tooltip: 'Test foot brake response and confirm handbrake holds securely.' },
    { key: 'extinguisher', label: 'Fire Extinguisher Available', tooltip: 'Ensure cabin fire extinguisher is present, sealed, and in-gauge.' },
    { key: 'firstaid', label: 'First Aid Box Available', tooltip: 'Verify first aid medical kit is present and stocked.' },
    { key: 'seatbelts', label: 'Seat Belts Available', tooltip: 'Ensure seat belts retract and buckle holds firmly.' },
  ];

  const isDisabled = status !== 'DRAFT';

  return (
    <FormWrapper
      title="1. VEHICLE INSPECTION CHECKLIST PTW"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
      approverSignature={approverSignature}
    >
      {/* SECTION 1: BASIC INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Vehicle Number</label>
            <input
              type="text"
              required
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. JE-9382"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Driver Name</label>
            <input
              type="text"
              required
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Supervisor Name</label>
            <input
              type="text"
              required
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Salim Qureshi"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Dispatch Time</label>
            <input
              type="time"
              required
              value={dispatchTime}
              onChange={(e) => setDispatchTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-150 pb-2">
          <h3 className="text-xs font-bold text-brand-navy tracking-wider">
            Checklist
          </h3>
          <span className="text-[10px] text-gray-600 font-medium italic">Hover info icon for verification criteria</span>
        </div>

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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleCheck(item.key, 'good')}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    checklist[item.key] === 'good'
                      ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                  }`}
                >
                  {checklist[item.key] === 'good' && <span>✓</span>} Good
                </button>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.key, 'damaged')}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    checklist[item.key] === 'damaged'
                      ? 'bg-red-650 border-2 border-red-800 text-white shadow-sm ring-1 ring-red-500/20'
                      : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                  }`}
                >
                  {checklist[item.key] === 'damaged' && <span>✗</span>} Damaged
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: REMARKS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Remarks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Damage Observation Text Field */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Damage Observation</label>
            <textarea
              value={damageObservation}
              onChange={(e) => setDamageObservation(e.target.value)}
              placeholder="Describe any damaged parts or issues here..."
              rows={4}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>

          {/* Supervisor Approval Stamp */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4.5 flex flex-col justify-between h-fit min-h-[120px]">
            <span className="text-xs font-bold text-gray-600 block tracking-wider">Supervisor Approval</span>
            
            <div className="mt-4 flex items-center gap-3">
              {status === 'APPROVED' ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                  <div>
                    <div>Approved & Signed</div>
                    <div className="text-[10px] text-gray-600 font-mono font-normal mt-0.5">Verified by Supervisor</div>
                  </div>
                </div>
              ) : status === 'REJECTED' ? (
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm bg-red-55/30 border border-red-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <ShieldAlert className="h-5 w-5" />
                  <div>
                    <div>Safety Rejected</div>
                    <div className="text-[10px] text-gray-655 font-mono font-normal mt-0.5">Verification failed</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl shadow-xs animate-pulse">
                  <ShieldAlert className="h-5 w-5" />
                  <div>
                    <div>Awaiting Sign-off</div>
                    <div className="text-[10px] text-gray-655 font-mono font-normal mt-0.5">Pending Supervisor verification</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER SIGNATURE */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="max-w-md">
          <SignaturePad
            label="Driver Signature"
            role="Driver/Technician"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

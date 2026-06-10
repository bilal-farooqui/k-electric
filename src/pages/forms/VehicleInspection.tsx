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

export const VehicleInspection: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-VI-01';
  
  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [plateNo, setPlateNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Bucket Truck');
  const [driverName, setDriverName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState<Record<string, 'good' | 'damaged'>>({
    brakes: 'good',
    tires: 'good',
    lights: 'good',
    horn: 'good',
    wipers: 'good',
    seatbelts: 'good',
    extinguisher: 'good',
    firstaid: 'good',
    cones: 'good',
    winch: 'good',
  });
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setPlateNo(data.plateNo || '');
        setVehicleType(data.vehicleType || 'Bucket Truck');
        setDriverName(data.driverName || '');
        setOdometer(data.odometer || '');
        setInspectionDate(data.inspectionDate || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
      }
    } else {
      setPermitId(`KE-VI-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setPlateNo('');
      setVehicleType('Bucket Truck');
      setDriverName(currentUser?.name || '');
      setOdometer('');
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setChecklist({
        brakes: 'good',
        tires: 'good',
        lights: 'good',
        horn: 'good',
        wipers: 'good',
        seatbelts: 'good',
        extinguisher: 'good',
        firstaid: 'good',
        cones: 'good',
        winch: 'good',
      });
      setSignature('');
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
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: driverName,
      formData: {
        plateNo,
        vehicleType,
        driverName,
        odometer,
        inspectionDate,
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

    if (!plateNo || !odometer || !driverName) {
      alert('Please fill out all basic information metadata fields.');
      return;
    }

    if (!signature) {
      alert('A digital signature or authorization stamp is required to submit.');
      return;
    }

    const hasDamagedItems = Object.values(checklist).some((val) => val === 'damaged');
    const finalStatus = hasDamagedItems ? 'pending' : 'approved';

    const newPermit: Permit = {
      id: permitId,
      type: 'vehicle-inspection',
      title: 'Vehicle Inspection Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: driverName,
      approvedBy: finalStatus === 'approved' ? 'Automated System Verification' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        plateNo,
        vehicleType,
        driverName,
        odometer,
        inspectionDate,
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
      hasDamagedItems
        ? 'Permit submitted with safety concerns. Awaiting Shift Engineer approval.'
        : 'Permit submitted and auto-authorized!'
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
    { key: 'brakes', label: 'Brake System & Fluid Level', tooltip: 'Test foot brake and parking brake response.' },
    { key: 'tires', label: 'Tires & Inflation Pressure', tooltip: 'Ensure tread depth is safe and pressure is at PSI spec.' },
    { key: 'lights', label: 'Lights, Blinkers & Horn', tooltip: 'Check headlamps, hazard lights, indicators and reverse horn.' },
    { key: 'wipers', label: 'Windshield Wipers & Fluid', tooltip: 'Verify blades wipe cleanly without streaks.' },
    { key: 'seatbelts', label: 'Safety Seat Belts', tooltip: 'Ensure buckle holds firmly and straps retract.' },
    { key: 'extinguisher', label: 'Cabin Fire Extinguisher', tooltip: 'Check pressure dial gauge in the green zone.' },
    { key: 'firstaid', label: 'First Aid Kit Content', tooltip: 'Ensure bandages, antiseptic wipes, and burn creams are present.' },
    { key: 'cones', label: 'Traffic Safety Cones (x4)', tooltip: 'Ensure 4 reflective orange safety cones are loaded.' },
    { key: 'winch', label: 'Cable Puller / Winch', tooltip: 'Inspect bucket truck hoist or wire winch cables.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Vehicle Safety Inspection Sheet"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: BASIC INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Basic Vehicle & Dispatch Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">VEHICLE PLATE NUMBER</label>
            <input
              type="text"
              value={plateNo}
              onChange={(e) => setPlateNo(e.target.value)}
              placeholder="e.g. JE-9382"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">VEHICLE CATEGORY</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option>Bucket Truck</option>
              <option>Crane Truck</option>
              <option>Standard Pickup</option>
              <option>Inspection Van</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">ODOMETER READING (KM)</label>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="e.g. 14205"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DRIVER IN-CHARGE</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">INSPECTION DATE</label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-150 pb-2">
          <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase">
            II. Safety Verification Points
          </h3>
          <span className="text-[10px] text-gray-400 font-medium italic">Hover info icon for inspection criteria</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    checklist[item.key] === 'good'
                      ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                  }`}
                >
                  Good
                </button>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.key, 'damaged')}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    checklist[item.key] === 'damaged'
                      ? 'bg-red-650 border border-red-700 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                  }`}
                >
                  Damaged
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: AUTHORIZATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Authorization Sign-Off
        </h3>

        <div className="max-w-md">
          <SignaturePad
            label="DRIVER SIGNATURE"
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

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

export const HeatShrink: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-HS-09';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [jointKitRef, setJointKitRef] = useState('Raychem 11kV Jointing Kit');
  const [cableType, setCableType] = useState('XLPE Insulated');
  const [jointLocation, setJointLocation] = useState('Trench Clifton, Block 5');
  const [jointerNames, setJointerNames] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    gasHoseLeakTest: false,
    extinguisherPlaced: false,
    flammablesCleared: false,
    heatBarriersUsed: false,
    fireWatchCompleted: false,
  });

  const [jointerSig, setJointerSig] = useState('');
  const [supervisorSig, setSupervisorSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setJointKitRef(data.jointKitRef || '');
        setCableType(data.cableType || 'XLPE Insulated');
        setJointLocation(data.jointLocation || '');
        setJointerNames(data.jointerNames || '');
        setWorkDate(data.workDate || '');
        setChecklist(data.checklist || {});
        setJointerSig(data.jointerSig || '');
        setSupervisorSig(data.supervisorSig || '');
      }
    } else {
      setPermitId(`KE-HS-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setJointKitRef('Raychem 11kV Jointing Kit');
      setCableType('XLPE Insulated');
      setJointLocation('Trench Clifton, Block 5');
      setJointerNames(currentUser?.name || '');
      setWorkDate(new Date().toISOString().split('T')[0]);
      setChecklist({
        gasHoseLeakTest: false,
        extinguisherPlaced: false,
        flammablesCleared: false,
        heatBarriersUsed: false,
        fireWatchCompleted: false,
      });
      setJointerSig('');
      setSupervisorSig('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'heat-shrink',
      title: 'Heat Shrink PTW',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: jointerNames,
      formData: {
        jointKitRef,
        cableType,
        jointLocation,
        jointerNames,
        workDate,
        checklist,
        jointerSig,
        supervisorSig,
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

    if (!jointKitRef || !jointLocation || !jointerNames) {
      alert('Please fill out Joint Kit, Location, and Jointer Names.');
      return;
    }

    if (!jointerSig || !supervisorSig) {
      alert('BOTH Senior Jointer and Shift Supervisor signatures are required to authorize heat work.');
      return;
    }

    const allChecked = Object.values(checklist).every((val) => val === true);
    const finalStatus = allChecked ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'heat-shrink',
      title: 'Heat Shrink PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: jointerNames,
      approvedBy: finalStatus === 'approved' ? 'Substation Cable Jointing Superintendent' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        jointKitRef,
        cableType,
        jointLocation,
        jointerNames,
        workDate,
        checklist,
        jointerSig,
        supervisorSig,
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
        ? 'Heat Shrink jointing permit authorized! Hot work is cleared to proceed.'
        : 'Warning: Missing critical pre-heat checks. Permit set to Pending review.'
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
    { key: 'gasHoseLeakTest', label: 'Gas Cylinder & Hose Leak Test', tooltip: 'Use soapy water to test regulator connection, hose lines, and gas torch fittings for leaks.' },
    { key: 'extinguisherPlaced', label: 'Fire Extinguisher on Site (<2m)', tooltip: 'Keep 1x fully charged Dry Powder or CO2 fire extinguisher within arm\'s reach of the jointer.' },
    { key: 'flammablesCleared', label: 'Flammables Cleared (10m Radius)', tooltip: 'Remove cardboard boxes, cable packaging, dry grass, and petrol containers from hot work area.' },
    { key: 'heatBarriersUsed', label: 'Heat Barriers / Deflectors Installed', tooltip: 'If jointing in a cable tray adjacent to other live cables, install refractory heat sheets to deflect gas torch flame.' },
    { key: 'fireWatchCompleted', label: '30-Min Post-Work Fire Watch Planned', tooltip: 'A dedicated safety crew must monitor the joint site for 30 minutes after extinguishing the gas torch.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Heat Shrink Jointing & Hot Work Permit"
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
          I. Cable Jointing Specifications
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CABLE JOINT KIT REF</label>
            <input
              type="text"
              value={jointKitRef}
              onChange={(e) => setJointKitRef(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CABLE INSULATION TYPE</label>
            <select
              value={cableType}
              onChange={(e) => setCableType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option>XLPE Insulated</option>
              <option>PILC (Paper Insulated Lead Covered)</option>
              <option>PVC Insulated</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">JOINT SITE LOCATION</label>
            <input
              type="text"
              value={jointLocation}
              onChange={(e) => setJointLocation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">SENIOR JOINTER NAMES</label>
            <input
              type="text"
              value={jointerNames}
              onChange={(e) => setJointerNames(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">SCHEDULED WORK DATE</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Pre-Heat Jointing Safety Checklist
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
                    : 'bg-gray-105 border border-gray-300 text-gray-655 hover:bg-gray-200'
                }`}
              >
                {checklist[item.key] ? 'Verified' : 'Pending'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SIGNATURES */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Jointing Authorization Sign-Off
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. SENIOR CABLE JOINTER SIGNATURE"
            role="Senior Cable Jointer"
            onSign={setJointerSig}
            savedSignature={jointerSig}
            disabled={isDisabled}
          />

          <SignaturePad
            label="2. SITE SHIFT SUPERVISOR SIGNATURE"
            role="Shift Jointing Supervisor"
            onSign={setSupervisorSig}
            savedSignature={supervisorSig}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

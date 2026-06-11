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

  // Job Information
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cableId, setCableId] = useState('');
  const [jointLocation, setJointLocation] = useState('');

  // Heat Work Checklist
  const [heatChecklist, setHeatChecklist] = useState<Record<string, boolean>>({
    heatGunInspected: false,
    fireExtinguisherAvailable: false,
    cableIsolated: false,
    ppeWorn: false,
  });

  // Materials Used
  const [heatShrinkSleeve, setHeatShrinkSleeve] = useState('');
  const [jointKit, setJointKit] = useState('Raychem 11kV Jointing Kit');
  const [connectorType, setConnectorType] = useState('');

  // Work Completion
  const [jointTested, setJointTested] = useState(false);
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [completionTime, setCompletionTime] = useState('');

  // Signatures
  const [jointerSig, setJointerSig] = useState('');
  const [supervisorSig, setSupervisorSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const d = existing.formData;
      if (d) {
        setDate(d.date || new Date().toISOString().split('T')[0]);
        setCableId(d.cableId || '');
        setJointLocation(d.jointLocation || '');
        setHeatChecklist(d.heatChecklist || {});
        setHeatShrinkSleeve(d.heatShrinkSleeve || '');
        setJointKit(d.jointKit || 'Raychem 11kV Jointing Kit');
        setConnectorType(d.connectorType || '');
        setJointTested(!!d.jointTested);
        setSupervisorApproval(!!d.supervisorApproval);
        setCompletionTime(d.completionTime || '');
        setJointerSig(d.jointerSig || '');
        setSupervisorSig(d.supervisorSig || '');
      }
    } else {
      setPermitId(`KE-HS-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setDate(new Date().toISOString().split('T')[0]);
      setCableId('');
      setJointLocation('');
      setHeatChecklist({ heatGunInspected: false, fireExtinguisherAvailable: false, cableIsolated: false, ppeWorn: false });
      setHeatShrinkSleeve('');
      setJointKit('');
      setConnectorType('');
      setJointTested(false);
      setSupervisorApproval(false);
      setCompletionTime('');
      setJointerSig('');
      setSupervisorSig('');
    }
  }, [permits, editId, currentUser]);

  const toggleHeat = (key: string) =>
    setHeatChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const buildFormData = () => ({
    date,
    cableId,
    jointLocation,
    heatChecklist,
    heatShrinkSleeve,
    jointKit,
    connectorType,
    jointTested,
    supervisorApproval,
    completionTime,
    jointerSig,
    supervisorSig,
  });

  const saveToStore = (permit: Permit) => {
    const index = permits.findIndex((p) => p.id === permitId);
    const updated =
      index > -1 ? permits.map((p, i) => (i === index ? permit : p)) : [permit, ...permits];
    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
    return updated;
  };

  const handleSaveDraft = () => {
    saveToStore({
      id: permitId,
      type: 'heat-shrink',
      title: 'Heat Shrink PTW',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || '',
      formData: buildFormData(),
    });
    alert('Draft saved successfully!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cableId || !jointLocation) {
      alert('Please fill out Cable ID and Joint Location.');
      return;
    }

    if (!jointerSig || !supervisorSig) {
      alert('BOTH Senior Jointer and Shift Supervisor signatures are required to authorize heat work.');
      return;
    }

    const allHeatChecked = Object.values(heatChecklist).every(Boolean);
    const allCompletionChecked = jointTested && supervisorApproval;
    const finalStatus = allHeatChecked && allCompletionChecked ? 'approved' : 'pending';

    saveToStore({
      id: permitId,
      type: 'heat-shrink',
      title: 'Heat Shrink PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || '',
      approvedBy: finalStatus === 'approved' ? 'Substation Cable Jointing Superintendent' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: buildFormData(),
    });
    setStatus(finalStatus);
    alert(
      finalStatus === 'approved'
        ? 'Heat Shrink jointing permit authorized! Hot work is cleared to proceed.'
        : 'Warning: Missing critical pre-heat checks. Permit set to Pending review.'
    );
    navigate('/');
  };

  const handleApprove = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    saveToStore({
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
    });
    setStatus('approved');
    alert('Permit approved successfully!');
    navigate('/admin');
  };

  const handleReject = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    saveToStore({ ...existing, status: 'rejected' });
    setStatus('rejected');
    alert('Permit rejected.');
    navigate('/admin');
  };

  const isDisabled =
    status === 'approved' ||
    status === 'rejected' ||
    (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  const sectionHeader = (label: string) => (
    <div
      style={{
        color: '#1e3a5f',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderBottom: '1.5px solid #1e3a5f',
        paddingBottom: '4px',
        marginBottom: '10px',
      }}
    >
      {label}
    </div>
  );

  const CheckToggle = ({
    checked,
    onToggle,
    label,
    tooltip,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
    tooltip?: string;
  }) => (
    <div className="flex justify-between items-center bg-white border border-gray-250 rounded-xl px-4 py-3 shadow-xs hover:border-gray-350 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-brand-navy">{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          checked
            ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
            : 'bg-gray-105 border border-gray-300 text-gray-655 hover:bg-gray-200'
        }`}
      >
        {checked ? 'Yes' : 'No'}
      </button>
    </div>
  );

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
      {/* DESCRIPTION BANNER */}
      <div
        style={{
          background: '#f0f4f9',
          border: '1px solid #c7d5e8',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '0.875rem',
          color: '#374151',
          lineHeight: '1.6',
        }}
      >
        This PTW is applicable during cable jointing, termination, or any heat shrink activity involving
        heat guns and energized cable work.
      </div>

      {/* SECTION 1: JOB INFORMATION */}
      <div className="space-y-3">
        {sectionHeader('Job Information')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">PERMIT NUMBER</label>
            <input
              type="text"
              value={permitId}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 font-mono outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DATE</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CABLE ID</label>
            <input
              type="text"
              value={cableId}
              onChange={(e) => setCableId(e.target.value)}
              placeholder="e.g. XLPE-11kV-CB-04"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">JOINT LOCATION</label>
            <input
              type="text"
              value={jointLocation}
              onChange={(e) => setJointLocation(e.target.value)}
              placeholder="e.g. Trench Clifton, Block 5"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: HEAT WORK CHECKLIST */}
      <div className="space-y-3">
        {sectionHeader('Heat Work Checklist')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckToggle
            checked={heatChecklist.heatGunInspected}
            onToggle={() => toggleHeat('heatGunInspected')}
            label="Heat Gun Inspected"
            tooltip="Inspect heat gun for damaged cables, faulty trigger, and ensure temperature rating is appropriate for the sleeve type."
          />
          <CheckToggle
            checked={heatChecklist.fireExtinguisherAvailable}
            onToggle={() => toggleHeat('fireExtinguisherAvailable')}
            label="Fire Extinguisher Available"
            tooltip="Keep 1x fully charged Dry Powder or CO2 fire extinguisher within arm's reach of the jointer at all times."
          />
          <CheckToggle
            checked={heatChecklist.cableIsolated}
            onToggle={() => toggleHeat('cableIsolated')}
            label="Cable Isolated"
            tooltip="Confirm the cable section is de-energized, locked out, and tagged before any heat work commences."
          />
          <CheckToggle
            checked={heatChecklist.ppeWorn}
            onToggle={() => toggleHeat('ppeWorn')}
            label="PPE Worn"
            tooltip="All personnel must wear heat-resistant gloves, safety glasses, and flame-retardant coveralls during hot work."
          />
        </div>
      </div>

      {/* SECTION 3: MATERIALS USED */}
      <div className="space-y-3">
        {sectionHeader('Materials Used')}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">HEAT SHRINK SLEEVE</label>
            <input
              type="text"
              value={heatShrinkSleeve}
              onChange={(e) => setHeatShrinkSleeve(e.target.value)}
              placeholder="e.g. 3M HVST-1224/8-R"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">JOINT KIT</label>
            <input
              type="text"
              value={jointKit}
              onChange={(e) => setJointKit(e.target.value)}
              placeholder="e.g. Raychem 11kV Jointing Kit"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CONNECTOR TYPE</label>
            <input
              type="text"
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              placeholder="e.g. Compression Lug, Straight-Through"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: WORK COMPLETION */}
      <div className="space-y-3">
        {sectionHeader('Work Completion')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <CheckToggle
            checked={jointTested}
            onToggle={() => !isDisabled && setJointTested((v) => !v)}
            label="Joint Tested"
            tooltip="Post-jointing insulation resistance test (IR test / HV test) must be completed and values recorded."
          />
          <CheckToggle
            checked={supervisorApproval}
            onToggle={() => !isDisabled && setSupervisorApproval((v) => !v)}
            label="Supervisor Approval"
            tooltip="Shift supervisor must physically inspect the completed joint and sign off before site is cleared."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">COMPLETION TIME</label>
            <input
              type="time"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: SIGNATURES */}
      <div className="space-y-3">
        {sectionHeader('Jointing Authorization Sign-Off')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. SENIOR CABLE JOINTER"
            role="Senior Cable Jointer"
            onSign={setJointerSig}
            savedSignature={jointerSig}
            disabled={isDisabled}
          />
          <SignaturePad
            label="2. SITE SHIFT SUPERVISOR"
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import type { Permit, PermitStatus } from '../../types/ptw';

interface FormProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: any;
}

export const Excavation: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-EX-07';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Form State
  const [trenchLocation, setTrenchLocation] = useState('Lane 7, Phase 6 DHA');
  const [area, setArea] = useState('');
  const [purpose, setPurpose] = useState('HV Cable Jointing & Inspection');
  const [targetDepth, setTargetDepth] = useState('1.5');
  const [contractorName, setContractorName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedDuration, setPlannedDuration] = useState('3 days');

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    trialPitDug: false,
    utilitiesLocated: false,
    shoringBattering: false,
    barriersInstalled: false,
    accessEgress: false,
    spoilDistance: false,
  });

  const [supervisorSig, setSupervisorSig] = useState('');
  const [safetyOfficerSig, setSafetyOfficerSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setTrenchLocation(data.trenchLocation || '');
        setArea(data.area || '');
        setPurpose(data.purpose || '');
        setTargetDepth(data.targetDepth || '1.5');
        setContractorName(data.contractorName || '');
        setSupervisorName(data.supervisorName || '');
        setDate(data.date || new Date().toISOString().split('T')[0]);
        setPlannedDuration(data.plannedDuration || '');
        setChecklist(data.checklist || {});
        setSupervisorSig(data.supervisorSig || '');
        setSafetyOfficerSig(data.safetyOfficerSig || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-EX-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setTrenchLocation('Lane 7, Phase 6 DHA');
      setArea('');
      setPurpose('HV Cable Jointing & Inspection');
      setTargetDepth('1.5');
      setContractorName(currentUser?.name || '');
      setSupervisorName('');
      setDate(new Date().toISOString().split('T')[0]);
      setPlannedDuration('3 days');
      setChecklist({
        trialPitDug: false,
        utilitiesLocated: false,
        shoringBattering: false,
        barriersInstalled: false,
        accessEgress: false,
        spoilDistance: false,
      });
      setSupervisorSig('');
      setSafetyOfficerSig('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const buildPermitPayload = (overrideStatus: PermitStatus) => ({
    id: permitId,
    type: 'excavation' as const,
    title: 'Excavation PTW',
    status: overrideStatus,
    createdAt: new Date().toLocaleString(),
    submittedBy: contractorName,
    formData: {
      trenchLocation,
      area,
      purpose,
      targetDepth,
      contractorName,
      supervisorName,
      date,
      plannedDuration,
      checklist,
      supervisorSig,
      safetyOfficerSig,
      approverSignature,
    },
  });

  const saveToStore = (permit: Permit) => {
    const index = permits.findIndex((p) => p.id === permitId);
    const updated = index > -1 ? permits.map((p, i) => (i === index ? permit : p)) : [permit, ...permits];
    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
    return updated;
  };

  const handleSaveDraft = () => {
    saveToStore(buildPermitPayload('DRAFT'));
    alert('Draft saved successfully!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trenchLocation || !purpose || !contractorName) {
      alert('Please fill out Location, Purpose, and Contractor details.');
      return;
    }

    if (!supervisorSig || !safetyOfficerSig) {
      alert('BOTH Site Supervisor AND Safety Officer approvals are required to authorize excavation.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      ...buildPermitPayload(finalStatus),
    };

    saveToStore(newPermit);
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
      approvedBy: `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
      },
    };
    saveToStore(updatedPermit);
    setStatus('APPROVED');
    setApproverSignature(approverSig);
    alert('Permit approved successfully!');
    navigate('/admin');
  };

  const handleReject = (approverSig: string) => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'REJECTED',
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
      },
    };
    saveToStore(updatedPermit);
    setStatus('REJECTED');
    setApproverSignature(approverSig);
    alert('Permit rejected.');
    navigate('/admin');
  };

  const items = [
    { key: 'trialPitDug', label: 'Trial Pit Dug Manually', tooltip: 'Must excavate a trial pit manually using hand tools to verify exact cable location before mechanical excavation.' },
    { key: 'utilitiesLocated', label: 'Underground Utilities Clearance Verified', tooltip: 'Obtain alignment checks for gas pipelines, water pipes, telecom cables, and other electrical lines.' },
    { key: 'shoringBattering', label: 'Shoring or Wall Battering Placed', tooltip: 'For trenches deeper than 1.2 meters, walls must be sloped (battered) or shored with steel/wood to prevent cave-ins.' },
    { key: 'barriersInstalled', label: 'Fencing, Warning Tape & Lights Installed', tooltip: 'Place rigid barriers around the trench. Install blinking warning lamps if active at night.' },
    { key: 'accessEgress', label: 'Access Ladders Installed (<7.5m spacing)', tooltip: 'Provide safe ladders in the trench. Max distance from any worker to a ladder is 7.5 meters.' },
    { key: 'spoilDistance', label: 'Excavated Soil/Spoils Kept 1m Away', tooltip: 'Trench spoils must be piled at least 1 meter away from the edge of the excavation.' },
  ];

  const isDisabled = status !== 'DRAFT';

  // Inline style for underline blanks in the letter preview
  const blank = (val: string, width = '160px') => (
    <span
      style={{
        display: 'inline-block',
        minWidth: width,
        borderBottom: '1px solid #374151',
        marginLeft: '4px',
        marginRight: '4px',
        verticalAlign: 'bottom',
        color: val ? '#1e3a5f' : '#9ca3af',
        fontWeight: val ? 600 : 400,
        fontSize: '0.875rem',
        lineHeight: '1.6',
        paddingLeft: '2px',
      }}
    >
      {val || ''}
    </span>
  );

  return (
    <FormWrapper
      title="Trench Excavation Permit (Civil Works)"
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
      {/* LETTER PREVIEW */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          PTW Request Letter
        </h3>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '28px 32px',
            fontFamily: 'Georgia, serif',
            fontSize: '0.875rem',
            lineHeight: '2',
            color: '#111827',
          }}
        >
          <p style={{ marginBottom: '4px' }}>
            <strong>Subject:</strong> Excavation PTW Request
          </p>
          <p style={{ marginBottom: '12px' }}>Respected Sir,</p>
          <p style={{ marginBottom: '8px' }}>
            It is requested to issue an Excavation Permit to Work (PTW) for excavation activity at
            {blank(trenchLocation, '200px')} located in {blank(area, '160px')} area. The excavation is
            required for {blank(purpose, '220px')} with an estimated depth of {blank(targetDepth ? `${targetDepth} meters` : '', '120px')} through
            machine/manual excavation.
          </p>
          <p style={{ marginBottom: '8px' }}>
            All required safety precautions, including barricading, warning signs, underground utility
            identification, and PPE arrangements, have been ensured before commencement of work.
            Necessary excavation equipment and manpower are available at site.
          </p>
          <p style={{ marginBottom: '16px' }}>
            Kindly approve the Excavation PTW and authorize the work to proceed safely.
          </p>
          <p style={{ marginBottom: '4px' }}>
            Requested By: {blank(contractorName, '200px')}
          </p>
          <p style={{ marginBottom: '4px' }}>
            Supervisor Name: {blank(supervisorName, '180px')}
          </p>
          <p style={{ marginBottom: '4px' }}>
            Date: {blank(date, '180px')}
          </p>
        </div>
      </div>

      {/* SECTION 1: DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          I. Excavation Operations Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Contractor / Crew Name</label>
            <input
              type="text"
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Supervisor Name</label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Trench Site Location</label>
            <input
              type="text"
              value={trenchLocation}
              onChange={(e) => setTrenchLocation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Area</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. DHA Phase 6"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Purpose of Trench</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Target Depth (Meters)</label>
            <input
              type="number"
              step="0.1"
              value={targetDepth}
              onChange={(e) => setTargetDepth(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Planned Work Duration</label>
            <input
              type="text"
              value={plannedDuration}
              onChange={(e) => setPlannedDuration(e.target.value)}
              placeholder="e.g. 3 Days"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          II. Safety Protective Systems Checklist
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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  checklist[item.key]
                    ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                }`}
              >
                {checklist[item.key] ? '✓ Applied' : '✗ Pending'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SIGNATURES */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          III. Multi-Officer Safety Authorization Stamp
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. Civil Site Supervisor"
            role="Civil Works Site Supervisor"
            onSign={setSupervisorSig}
            savedSignature={supervisorSig}
            disabled={isDisabled}
          />

          <SignaturePad
            label="2. Division Safety Officer"
            role="Safety Inspector Officer"
            onSign={setSafetyOfficerSig}
            savedSignature={safetyOfficerSig}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

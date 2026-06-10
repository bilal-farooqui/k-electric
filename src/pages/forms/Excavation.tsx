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

export const Excavation: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-EX-07';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [trenchLocation, setTrenchLocation] = useState('Lane 7, Phase 6 DHA');
  const [purpose, setPurpose] = useState('HV Cable Jointing & Inspection');
  const [targetDepth, setTargetDepth] = useState('1.5');
  const [contractorName, setContractorName] = useState('');
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
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setTrenchLocation(data.trenchLocation || '');
        setPurpose(data.purpose || '');
        setTargetDepth(data.targetDepth || '1.5');
        setContractorName(data.contractorName || '');
        setPlannedDuration(data.plannedDuration || '');
        setChecklist(data.checklist || {});
        setSupervisorSig(data.supervisorSig || '');
        setSafetyOfficerSig(data.safetyOfficerSig || '');
      }
    } else {
      setPermitId(`KE-EX-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setTrenchLocation('Lane 7, Phase 6 DHA');
      setPurpose('HV Cable Jointing & Inspection');
      setTargetDepth('1.5');
      setContractorName(currentUser?.name || '');
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
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'excavation',
      title: 'Excavation PTW',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: contractorName,
      formData: {
        trenchLocation,
        purpose,
        targetDepth,
        contractorName,
        plannedDuration,
        checklist,
        supervisorSig,
        safetyOfficerSig,
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

    if (!trenchLocation || !purpose || !contractorName) {
      alert('Please fill out Location, Purpose, and Contractor details.');
      return;
    }

    if (!supervisorSig || !safetyOfficerSig) {
      alert('BOTH Site Supervisor AND Safety Officer approvals are required to authorize excavation.');
      return;
    }

    const allChecked = Object.values(checklist).every((val) => val === true);
    const finalStatus = allChecked ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'excavation',
      title: 'Excavation PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: contractorName,
      approvedBy: finalStatus === 'approved' ? 'Chief Safety Officer' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        trenchLocation,
        purpose,
        targetDepth,
        contractorName,
        plannedDuration,
        checklist,
        supervisorSig,
        safetyOfficerSig,
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
        ? 'Excavation permit approved! Excavation is authorized to begin.'
        : 'Warning: Missing core safety checklist items. Permit set to Pending review.'
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
    { key: 'trialPitDug', label: 'Trial Pit Dug Manually', tooltip: 'Must excavate a trial pit manually using hand tools to verify exact cable location before mechanical excavation.' },
    { key: 'utilitiesLocated', label: 'Underground Utilities Clearance Verified', tooltip: 'Obtain alignment checks for gas pipelines, water pipes, telecom cables, and other electrical lines.' },
    { key: 'shoringBattering', label: 'Shoring or Wall Battering Placed', tooltip: 'For trenches deeper than 1.2 meters, walls must be sloped (battered) or shored with steel/wood to prevent cave-ins.' },
    { key: 'barriersInstalled', label: 'Fencing, Warning Tape & Lights Installed', tooltip: 'Place rigid barriers around the trench. Install blinking warning lamps if active at night.' },
    { key: 'accessEgress', label: 'Access Ladders Installed (<7.5m spacing)', tooltip: 'Provide safe ladders in the trench. Max distance from any worker to a ladder is 7.5 meters.' },
    { key: 'spoilDistance', label: 'Excavated Soil/Spoils Kept 1m Away', tooltip: 'Trench spoils must be piled at least 1 meter away from the edge of the excavation.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

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
    >
      {/* SECTION 1: DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Excavation Operations Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CONTRACTOR / CREW NAME</label>
            <input
              type="text"
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TRENCH SITE LOCATION</label>
            <input
              type="text"
              value={trenchLocation}
              onChange={(e) => setTrenchLocation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">PURPOSE OF TRENCH</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TARGET DEPTH (METERS)</label>
            <input
              type="number"
              step="0.1"
              value={targetDepth}
              onChange={(e) => setTargetDepth(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">PLANNED WORK DURATION</label>
            <input
              type="text"
              value={plannedDuration}
              onChange={(e) => setPlannedDuration(e.target.value)}
              placeholder="e.g. 3 Days"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  checklist[item.key]
                    ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                    : 'bg-gray-105 border border-gray-300 text-gray-655 hover:bg-gray-200'
                }`}
              >
                {checklist[item.key] ? 'Applied' : 'Pending'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SIGNATURES */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Multi-Officer Safety Authorization Stamp
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. CIVIL SITE SUPERVISOR"
            role="Civil Works Site Supervisor"
            onSign={setSupervisorSig}
            savedSignature={supervisorSig}
            disabled={isDisabled}
          />

          <SignaturePad
            label="2. DIVISION SAFETY OFFICER"
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

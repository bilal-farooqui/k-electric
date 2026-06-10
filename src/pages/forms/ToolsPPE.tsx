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

export const ToolsPPE: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-TP-02';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [crewLeader, setCrewLeader] = useState('');
  const [gridStation, setGridStation] = useState('Substation Clifton C');
  const [workOrderId, setWorkOrderId] = useState('');
  const [crewSize, setCrewSize] = useState('4');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [checklist, setChecklist] = useState<Record<string, 'good' | 'defective' | 'missing'>>({
    pliers: 'good',
    screwdrivers: 'good',
    megger: 'good',
    multimeter: 'good',
    earthrod: 'good',
    ladder: 'good',
    stick: 'good',
    helmet: 'good',
    boots: 'good',
    vest: 'good',
    gloves: 'good',
    goggles: 'good',
    harness: 'good',
  });
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setCrewLeader(data.crewLeader || '');
        setGridStation(data.gridStation || '');
        setWorkOrderId(data.workOrderId || '');
        setCrewSize(data.crewSize || '');
        setInspectionDate(data.inspectionDate || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
      }
    } else {
      setPermitId(`KE-TP-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setCrewLeader(currentUser?.name || '');
      setGridStation('Substation Clifton C');
      setWorkOrderId('');
      setCrewSize('4');
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setChecklist({
        pliers: 'good',
        screwdrivers: 'good',
        megger: 'good',
        multimeter: 'good',
        earthrod: 'good',
        ladder: 'good',
        stick: 'good',
        helmet: 'good',
        boots: 'good',
        vest: 'good',
        gloves: 'good',
        goggles: 'good',
        harness: 'good',
      });
      setSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string, val: 'good' | 'defective' | 'missing') => {
    setChecklist((prev) => ({ ...prev, [item]: val }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'tools-ppe',
      title: 'Tools & PPE Checklist',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: crewLeader,
      formData: {
        crewLeader,
        gridStation,
        workOrderId,
        crewSize,
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

    if (!workOrderId || !crewLeader) {
      alert('Please fill out all basic information fields.');
      return;
    }

    if (!signature) {
      alert('A digital signature or authorization stamp is required to submit.');
      return;
    }

    const hasCriticalIssues = Object.values(checklist).some(
      (val) => val === 'defective' || val === 'missing'
    );
    const finalStatus = hasCriticalIssues ? 'pending' : 'approved';

    const newPermit: Permit = {
      id: permitId,
      type: 'tools-ppe',
      title: 'Tools & PPE Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: crewLeader,
      approvedBy: finalStatus === 'approved' ? 'Safety Officer Stamp' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        crewLeader,
        gridStation,
        workOrderId,
        crewSize,
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
      hasCriticalIssues
        ? 'Defective or missing gear noted. Awaiting Safety Inspector approval.'
        : 'Permit successfully verified and approved!'
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

  const tools = [
    { key: 'pliers', label: 'Insulated Pliers (1000V rated)', tooltip: 'Must be rated for 1000V and free from crack/peel in insulation handles.' },
    { key: 'screwdrivers', label: 'Insulated Screwdrivers Set', tooltip: 'Verify insulation covers the shaft right down to the tip.' },
    { key: 'megger', label: 'Megger / Insulation Tester', tooltip: 'Test battery level and display calibration dates.' },
    { key: 'multimeter', label: 'Digital Multimeter', tooltip: 'Ensure probes are intact and category rating matches feeder voltage.' },
    { key: 'earthrod', label: 'Portable Ground / Earth Rod', tooltip: 'Check heavy duty copper clamp tightness and cable continuity.' },
    { key: 'ladder', label: 'Fiberglass / A-Type Ladder', tooltip: 'Under no circumstances use aluminum ladders near power lines. Check fiberglass for cracks.' },
    { key: 'stick', label: 'HV Telescopic Discharge Stick', tooltip: 'Insulated discharge stick checked for dry surface and structure integrity.' },
  ];

  const ppe = [
    { key: 'helmet', label: 'Utility Safety Helmet (Class E)', tooltip: 'Class E helmet rated for 20,000V electrical work. Inspect suspension straps.' },
    { key: 'boots', label: 'Insulated Boots (11kV rated)', tooltip: 'Check rubber soles for wear, spikes, or metal punctures.' },
    { key: 'vest', label: 'High-Visibility Safety Vest', tooltip: 'Must be clean, reflective, and visible at night.' },
    { key: 'gloves', label: 'Insulated Rubber Gloves (Class 1)', tooltip: 'Perform air leak test prior to each use. Check date stamp.' },
    { key: 'goggles', label: 'Arc Flash Goggles / Face Shield', tooltip: 'Arc rating must match prospective fault level (cal/cm²).' },
    { key: 'harness', label: 'Full Body Safety Harness & Lanyard', tooltip: 'Required for any height work > 1.8m. Inspect D-rings and buckle clips.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Tools & PPE Safety checklist"
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
          I. Dispatch Parameters & Crew Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CREW LEADER NAME</label>
            <input
              type="text"
              value={crewLeader}
              onChange={(e) => setCrewLeader(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TARGET SUBSTATION / GRID</label>
            <input
              type="text"
              value={gridStation}
              onChange={(e) => setGridStation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">WORK ORDER ID</label>
            <input
              type="text"
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              placeholder="e.g. WO-92840-A"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CREW SIZE (PEOPLE)</label>
            <input
              type="number"
              value={crewSize}
              onChange={(e) => setCrewSize(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">VERIFICATION DATE</label>
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

      {/* SECTION 2: TOOLS CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Insulated Tools Inspection
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4.5 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <div className="flex gap-1.5">
                {(['good', 'defective', 'missing'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheck(item.key, opt)}
                    disabled={isDisabled}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                          : opt === 'defective'
                          ? 'bg-red-650 border border-red-700 text-white shadow-sm'
                          : 'bg-amber-50 border border-amber-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: PPE CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Personal Protective Equipment (PPE) Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ppe.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4.5 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <div className="flex gap-1.5">
                {(['good', 'defective', 'missing'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheck(item.key, opt)}
                    disabled={isDisabled}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                          : opt === 'defective'
                          ? 'bg-red-650 border border-red-700 text-white shadow-sm'
                          : 'bg-amber-50 border border-amber-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: AUTHORIZATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          IV. Safety Inspector Sign-Off
        </h3>

        <div className="max-w-md">
          <SignaturePad
            label="SAFETY INSPECTOR SIGNATURE"
            role="Safety Inspector / Supervisor"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

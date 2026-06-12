import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { Permit, PermitStatus } from '../../types/ptw';

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
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Form State
  const [teamLeader, setTeamLeader] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [faultId, setFaultId] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [signature, setSignature] = useState('');
  const [authSignature, setAuthSignature] = useState('');
  const [checklist, setChecklist] = useState<Record<string, 'good' | 'damaged' | 'missing'>>({
    // PPE
    helmet: 'good',
    gloves: 'good',
    shoes: 'good',
    jacket: 'good',
    goggles: 'good',
    harness: 'good',
    // Tools
    voltageDetector: 'good',
    insulatedPliers: 'good',
    cableCutter: 'good',
    earthRod: 'good',
    lotoKit: 'good',
    ladder: 'good',
    testingMeter: 'good',
  });

  // Load existing data if editId is provided
  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setTeamLeader(data.teamLeader || '');
        setDate(data.date || '');
        setFaultId(data.faultId || '');
        setWorkLocation(data.workLocation || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
        setAuthSignature(data.authSignature || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-TP-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setTeamLeader(currentUser?.name || '');
      setDate(new Date().toISOString().split('T')[0]);
      setFaultId('');
      setWorkLocation('');
      setChecklist({
        helmet: 'good',
        gloves: 'good',
        shoes: 'good',
        jacket: 'good',
        goggles: 'good',
        harness: 'good',
        voltageDetector: 'good',
        insulatedPliers: 'good',
        cableCutter: 'good',
        earthRod: 'good',
        lotoKit: 'good',
        ladder: 'good',
        testingMeter: 'good',
      });
      setSignature('');
      setAuthSignature('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string, val: 'good' | 'damaged' | 'missing') => {
    setChecklist((prev) => ({ ...prev, [item]: val }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'tools-ppe',
      title: 'Tools & PPE Checklist',
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: teamLeader,
      formData: {
        teamLeader,
        date,
        faultId,
        workLocation,
        checklist,
        signature,
        authSignature,
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

    if (!teamLeader || !date || !faultId || !workLocation) {
      alert('Please fill out all General Information details.');
      return;
    }

    if (!signature) {
      alert('Team Leader signature is required to submit.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      id: permitId,
      type: 'tools-ppe',
      title: 'Tools & PPE Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: teamLeader,
      formData: {
        teamLeader,
        date,
        faultId,
        workLocation,
        checklist,
        signature,
        authSignature: '',
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
        authSignature: approverSig,
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
        authSignature: approverSig,
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

  const ppeItems = [
    { key: 'helmet', label: 'Safety Helmet', tooltip: 'Must be Class E rated. Check for cracks or suspension damage.' },
    { key: 'gloves', label: 'Safety Gloves', tooltip: 'Verify class rating and date stamp. Conduct inflation leak check.' },
    { key: 'shoes', label: 'Safety Shoes', tooltip: 'Insulated safety footwear. Sole must be intact without punctures.' },
    { key: 'jacket', label: 'Reflective Jacket', tooltip: 'Hi-vis jacket. Reflective stripes must be clean.' },
    { key: 'goggles', label: 'Safety Goggles', tooltip: 'Verify fit and scratch-free lens visibility.' },
    { key: 'harness', label: 'Harness/Belt', tooltip: 'Fall protection harness. Webbing must be free from tears.' },
  ];

  const toolsItems = [
    { key: 'voltageDetector', label: 'Voltage Detector', tooltip: 'Test operation on live source prior to checking lines.' },
    { key: 'insulatedPliers', label: 'Insulated Pliers', tooltip: 'Insulation must be rated for 1000V with no cracks.' },
    { key: 'cableCutter', label: 'Cable Cutter', tooltip: 'Verify cutting jaws are sharp and handles are insulated.' },
    { key: 'earthRod', label: 'Earth Rod', tooltip: 'Verify copper grounding rod and flexible cable clamps are secure.' },
    { key: 'lotoKit', label: 'LOTO Kit', tooltip: 'Locks, padlocks, tags, and hasps must be loaded.' },
    { key: 'ladder', label: 'Ladder', tooltip: 'Fiberglass A-type ladder. Check rungs and anti-slip feet.' },
    { key: 'testingMeter', label: 'Testing Meter', tooltip: 'Digital multimeter or insulation megger calibrated.' },
  ];

  const isAuthorizerDisabled = true;
  const isDisabled = status !== 'DRAFT';

  // Find approval data
  const existingPermit = permits.find((p) => p.id === permitId);
  const approvedByVal = existingPermit?.approvedBy || (status === 'PENDING_APPROVAL' && currentUser?.role === 'Principal Safety Officer' ? `${currentUser?.name} (${currentUser?.role || 'Safety Officer'})` : 'Awaiting Approval');
  const approvedAtVal = existingPermit?.approvedAt || (status === 'PENDING_APPROVAL' && currentUser?.role === 'Principal Safety Officer' ? new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() : 'Pending Review');

  return (
    <FormWrapper
      title="2. TOOLS & PPE CHECKLIST PTW"
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
      {/* SECTION 1: GENERAL INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          General Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Team Leader</label>
            <input
              type="text"
              required
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
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
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-55"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Fault ID</label>
            <input
              type="text"
              required
              value={faultId}
              onChange={(e) => setFaultId(e.target.value)}
              placeholder="e.g. FLT-9028A"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-55 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Work Location</label>
            <input
              type="text"
              required
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g. Substation Feed B"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-55 placeholder-gray-550"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: PPE CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          PPE Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ppeItems.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4.5 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <div className="flex gap-1.5">
                {(['good', 'damaged', 'missing'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheck(item.key, opt)}
                    disabled={isDisabled}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                          : opt === 'damaged'
                          ? 'bg-red-650 border-2 border-red-800 text-white shadow-sm ring-1 ring-red-500/20'
                          : 'bg-amber-600 border-2 border-amber-700 text-white shadow-sm ring-1 ring-amber-500/20'
                        : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-705'
                    }`}
                  >
                    {opt === 'good' ? '✓ Good' : opt === 'damaged' ? '✗ Damaged' : '⚠ Missing'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 3: TOOLS CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Tools Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toolsItems.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4.5 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <div className="flex gap-1.5">
                {(['good', 'damaged', 'missing'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheck(item.key, opt)}
                    disabled={isDisabled}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                          : opt === 'damaged'
                          ? 'bg-red-650 border-2 border-red-800 text-white shadow-sm ring-1 ring-red-500/20'
                          : 'bg-amber-600 border-2 border-amber-700 text-white shadow-sm ring-1 ring-amber-500/20'
                        : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-705'
                    }`}
                  >
                    {opt === 'good' ? '✓ Good' : opt === 'damaged' ? '✗ Damaged' : '⚠ Missing'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <hr className="border-t-2 border-brand-primary/20 my-6" />
 
      {/* SECTION 4: Condition */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Condition
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2.5 bg-emerald-50/50 border border-emerald-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">G</span>
            <div>
              <span className="font-bold text-emerald-800 block">Good</span>
              Gear is certified, undamaged, and safe for live operations.
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-red-50/50 border border-red-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-red-650 text-white font-bold flex items-center justify-center text-[9px]">D</span>
            <div>
              <span className="font-bold text-red-800 block">Damaged</span>
              Gear shows signs of wear/cracks. Requires supervisor sign-off.
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-[9px]">M</span>
            <div>
              <span className="font-bold text-amber-800 block">Missing</span>
              Gear is absent. Operations restricted until replacement sourced.
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* Team Leader Sign-off */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Team Leader Sign-off
        </h3>
        <div className="max-w-md">
          <SignaturePad
            label="Team Leader Signature"
            role="Team Leader / Dispatcher"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: Authorization */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Authorization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Approved By</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedByVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Time</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedAtVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
            <div className={`w-full border rounded-lg px-3 py-2 text-xs font-bold h-[38px] flex items-center justify-center gap-1.5 ${
              status === 'APPROVED' 
                ? 'bg-emerald-50 border-emerald-305 text-emerald-800' 
                : status === 'REJECTED' 
                ? 'bg-red-50 border-red-350 text-red-800' 
                : 'bg-amber-50 border-amber-305 text-amber-800 animate-pulse'
            }`}>
              {status === 'APPROVED' ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Level 4 Signed
                </>
              ) : status === 'REJECTED' ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-red-650" /> Verification Failed
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" /> Pending Re-sign
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <SignaturePad
            label="Supervisor Signature"
            role="Authorized Supervisor"
            onSign={setAuthSignature}
            savedSignature={authSignature || (status === 'APPROVED' && approvedByVal.includes('Automated System') ? 'STAMP::GREEN::Automated System Verification (System) - Authorized at ' + approvedAtVal : undefined)}
            disabled={isAuthorizerDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};


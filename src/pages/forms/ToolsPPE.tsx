import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
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
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setTeamLeader(data.teamLeader || '');
        setDate(data.date || '');
        setFaultId(data.faultId || '');
        setWorkLocation(data.workLocation || '');
        setChecklist(data.checklist || {});
        setSignature(data.signature || '');
        setAuthSignature(data.authSignature || '');
      }
    } else {
      setPermitId(`KE-TP-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
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
      status: 'draft',
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

    const hasIssues = Object.values(checklist).some(
      (val) => val === 'damaged' || val === 'missing'
    );
    const finalStatus = hasIssues ? 'pending' : 'approved';

    const newPermit: Permit = {
      id: permitId,
      type: 'tools-ppe',
      title: 'Tools & PPE Checklist',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: teamLeader,
      approvedBy: finalStatus === 'approved' ? 'Automated System Verification' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        teamLeader,
        date,
        faultId,
        workLocation,
        checklist,
        signature,
        authSignature: finalStatus === 'approved' ? 'STAMP::GREEN::Automated System Verification (System) - Authorized at ' + new Date().toLocaleString() : '',
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
      hasIssues
        ? 'Checklist submitted with gear concerns. Awaiting Supervisor approval.'
        : 'Checklist submitted and approved!'
    );
    navigate('/');
  };

  const handleApprove = () => {
    if (!authSignature && status === 'pending') {
      alert('Supervisor signature is required under AUTHORIZATION to approve.');
      return;
    }
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'Supervisor'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        authSignature,
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
    alert('Permit approved successfully by Supervisor!');
    navigate('/admin');
  };

  const handleReject = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'rejected',
      approvedBy: `${currentUser?.name || 'Supervisor'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        authSignature,
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

  const isAuthorizerDisabled = status === 'approved' || status === 'rejected' || currentUser?.label !== 'admin';
  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.label === 'admin' && status === 'pending');

  // Find approval data
  const existingPermit = permits.find((p) => p.id === permitId);
  const approvedByVal = existingPermit?.approvedBy || (status === 'pending' && currentUser?.label === 'admin' ? `${currentUser?.name} (${currentUser?.role || 'Safety Officer'})` : 'Awaiting Approval');
  const approvedAtVal = existingPermit?.approvedAt || (status === 'pending' && currentUser?.label === 'admin' ? new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() : 'Pending Review');

  return (
    <FormWrapper
      title="2. TOOLS & PPE CHECKLIST PTW"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.label === 'admin'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: GENERAL INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          GENERAL INFORMATION
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TEAM LEADER</label>
            <input
              type="text"
              required
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
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
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT ID</label>
            <input
              type="text"
              required
              value={faultId}
              onChange={(e) => setFaultId(e.target.value)}
              placeholder="e.g. FLT-9028A"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">WORK LOCATION</label>
            <input
              type="text"
              required
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g. Substation Feed B"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: PPE CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          PPE CHECKLIST
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
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                          : opt === 'damaged'
                          ? 'bg-red-650 border border-red-700 text-white shadow-sm'
                          : 'bg-amber-500 border border-amber-600 text-white shadow-sm'
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

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 3: TOOLS CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          TOOLS CHECKLIST
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
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      checklist[item.key] === opt
                        ? opt === 'good'
                          ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                          : opt === 'damaged'
                          ? 'bg-red-650 border border-red-700 text-white shadow-sm'
                          : 'bg-amber-500 border border-amber-600 text-white shadow-sm'
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

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 4: CONDITION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          CONDITION
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2.5 bg-emerald-50/50 border border-emerald-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">G</span>
            <div>
              <span className="font-bold text-emerald-800 block">GOOD</span>
              Gear is certified, undamaged, and safe for live operations.
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-red-50/50 border border-red-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-red-650 text-white font-bold flex items-center justify-center text-[9px]">D</span>
            <div>
              <span className="font-bold text-red-800 block">DAMAGED</span>
              Gear shows signs of wear/cracks. Requires supervisor sign-off.
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-150 p-3 rounded-xl text-gray-700">
            <span className="h-4.5 w-4.5 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-[9px]">M</span>
            <div>
              <span className="font-bold text-amber-800 block">MISSING</span>
              Gear is absent. Operations restricted until replacement sourced.
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SUBMISSION / TEAM LEADER SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          TEAM LEADER SIGN-OFF
        </h3>
        <div className="max-w-md">
          <SignaturePad
            label="TEAM LEADER SIGNATURE"
            role="Team Leader / Dispatcher"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: AUTHORIZATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          AUTHORIZATION
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">APPROVED BY</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedByVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TIME</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {approvedAtVal}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">STATUS</label>
            <div className={`w-full border rounded-lg px-3 py-2 text-xs font-bold uppercase h-[38px] flex items-center justify-center gap-1.5 ${
              status === 'approved' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : status === 'rejected' 
                ? 'bg-red-50 border-red-300 text-red-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
            }`}>
              {status === 'approved' ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> LEVEL 4 SIGNED
                </>
              ) : status === 'rejected' ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-red-650" /> VERIFICATION FAILED
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" /> PENDING RE-SIGN
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <SignaturePad
            label="SUPERVISOR SIGNATURE"
            role="Authorized Supervisor"
            onSign={setAuthSignature}
            savedSignature={authSignature || (status === 'approved' && approvedByVal.includes('Automated System') ? 'STAMP::GREEN::Automated System Verification (System) - Authorized at ' + approvedAtVal : undefined)}
            disabled={isAuthorizerDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};


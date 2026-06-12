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

export const LineIsolation: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-LI-06';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isolatingSubstation, setIsolatingSubstation] = useState('');
  const [feederName, setFeederName] = useState('');
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    breakerOpened: false,
    rmuIsolated: false,
    lotoApplied: false,
    earthApplied: false,
    voltageTested: false,
  });

  const [isolationDoneBy, setIsolationDoneBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [zeroVoltageConfirmed, setZeroVoltageConfirmed] = useState(false);
  const [groundingCompleted, setGroundingCompleted] = useState(false);
  const [reEnergizationTime, setReEnergizationTime] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');

  const [issuerSig, setIssuerSig] = useState('');
  const [receiverSig, setReceiverSig] = useState('');
  const [authorizerSig, setAuthorizerSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setDate(data.date || '');
        setFeederName(data.feederName || '');
        setIsolatingSubstation(data.isolatingSubstation || '');
        setChecklist(data.checklist || {});
        setIsolationDoneBy(data.isolationDoneBy || '');
        setVerifiedBy(data.verifiedBy || '');
        setZeroVoltageConfirmed(!!data.zeroVoltageConfirmed);
        setGroundingCompleted(!!data.groundingCompleted);
        setReEnergizationTime(data.reEnergizationTime || '');
        setAuthorizedBy(data.authorizedBy || '');
        setIssuerSig(data.issuerSig || '');
        setReceiverSig(data.receiverSig || '');
        setAuthorizerSig(data.authorizerSig || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-LI-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setDate(new Date().toISOString().split('T')[0]);
      setFeederName('');
      setIsolatingSubstation('');
      setChecklist({
        breakerOpened: false,
        rmuIsolated: false,
        lotoApplied: false,
        earthApplied: false,
        voltageTested: false,
      });
      setIsolationDoneBy('');
      setVerifiedBy('');
      setZeroVoltageConfirmed(false);
      setGroundingCompleted(false);
      setReEnergizationTime('');
      setAuthorizedBy('');
      setIssuerSig('');
      setReceiverSig('');
      setAuthorizerSig('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'line-isolation',
      title: '6. LINE ISOLATION PTW',
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: isolationDoneBy || currentUser?.name || 'Operator',
      formData: {
        date,
        feederName,
        isolatingSubstation,
        checklist,
        isolationDoneBy,
        verifiedBy,
        zeroVoltageConfirmed,
        groundingCompleted,
        reEnergizationTime,
        authorizedBy,
        issuerSig,
        receiverSig,
        authorizerSig,
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

    if (!feederName || !isolatingSubstation) {
      alert('Please fill out Substation Name and Feeder Name.');
      return;
    }

    if (!issuerSig || !receiverSig) {
      alert('Signatures for both Isolation Done By and Verified By are required.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      id: permitId,
      type: 'line-isolation',
      title: '6. LINE ISOLATION PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: isolationDoneBy || currentUser?.name || 'Operator',
      formData: {
        date,
        feederName,
        isolatingSubstation,
        checklist,
        isolationDoneBy,
        verifiedBy,
        zeroVoltageConfirmed,
        groundingCompleted,
        reEnergizationTime,
        authorizedBy,
        issuerSig,
        receiverSig,
        authorizerSig,
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
      approvedBy: `${currentUser?.name || 'Safety Officer'} (${currentUser?.role || 'Safety Officer'})`,
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
    { key: 'breakerOpened', label: 'Circuit Breaker Opened', tooltip: 'Verify main breaker has been switched off.' },
    { key: 'rmuIsolated', label: 'RMU Isolated', tooltip: 'Verify Ring Main Unit switches have been isolated.' },
    { key: 'lotoApplied', label: 'LOTO Applied', tooltip: 'Verify Lockout/Tagout tags and padlocks are in place.' },
    { key: 'earthApplied', label: 'Earth Applied', tooltip: 'Verify earthing connections are closed/applied.' },
    { key: 'voltageTested', label: 'Voltage Tested', tooltip: 'Verify lines are tested dead with a voltage detector.' },
  ];

  const isAdmin = currentUser?.role === 'Principal Safety Officer';
  const isAuthorizerDisabled = true;
  const isDisabled = status !== 'DRAFT';

  return (
    <FormWrapper
      title="6. LINE ISOLATION PTW"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={isAdmin}
      onApprove={handleApprove}
      onReject={handleReject}
      approverSignature={approverSignature}
    >
      {/* SECTION 1: MAIN DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Main Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Isolation Permit No</label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {permitId}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Substation Name</label>
            <input
              type="text"
              required
              value={isolatingSubstation}
              onChange={(e) => setIsolatingSubstation(e.target.value)}
              placeholder="e.g. Clifton Grid Station"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Feeder Name</label>
            <input
              type="text"
              required
              value={feederName}
              onChange={(e) => setFeederName(e.target.value)}
              placeholder="e.g. Feeder Clifton 11kV"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-55 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: ISOLATION INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Isolation Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div 
              key={item.key} 
              className="bg-white border border-gray-250 p-4 rounded-xl shadow-xs flex justify-between items-center hover:border-gray-350 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-navy">{item.label}</span>
                <Tooltip content={item.tooltip} />
              </div>

              <button
                type="button"
                onClick={() => toggleCheck(item.key)}
                disabled={isDisabled}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  checklist[item.key]
                    ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                }`}
              >
                {checklist[item.key] ? '✓ Yes' : '✗ No'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 3: TEAM DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Team Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Isolation Done By</label>
              <input
                type="text"
                required
                value={isolationDoneBy}
                onChange={(e) => setIsolationDoneBy(e.target.value)}
                placeholder="Name of Operator"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
                disabled={isDisabled}
              />
            </div>
            <SignaturePad
              label="Signature of Operator"
              role="Isolation Done By"
              onSign={setIssuerSig}
              savedSignature={issuerSig}
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Verified By</label>
              <input
                type="text"
                required
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="Name of Verifier"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
                disabled={isDisabled}
              />
            </div>
            <SignaturePad
              label="Signature of Verifier"
              role="Verified By"
              onSign={setReceiverSig}
              savedSignature={receiverSig}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 4: SAFETY CONFIRMATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Safety Confirmation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setZeroVoltageConfirmed(!zeroVoltageConfirmed)}
            disabled={isDisabled}
            className={`p-4 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              zeroVoltageConfirmed
                ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={zeroVoltageConfirmed}
                readOnly
                className="accent-emerald-600 font-bold"
              />
              Zero Voltage Confirmed
            </span>
          </button>

          <button
            type="button"
            onClick={() => setGroundingCompleted(!groundingCompleted)}
            disabled={isDisabled}
            className={`p-4 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              groundingCompleted
                ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={groundingCompleted}
                readOnly
                className="accent-emerald-600 font-bold"
              />
              Grounding Completed
            </span>
          </button>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: RESTORATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Restoration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Re-Energization Time</label>
            <input
              type="text"
              required
              value={reEnergizationTime}
              onChange={(e) => setReEnergizationTime(e.target.value)}
              placeholder="e.g. 15:45 or 4:30 PM"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isAuthorizerDisabled}
            />
          </div>

          <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Authorized By</label>
              <input
                type="text"
                required
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                placeholder="Name of Safety Supervisor"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-55 placeholder-gray-500"
                disabled={isAuthorizerDisabled}
              />
            </div>
            <SignaturePad
              label="Signature of Supervisor"
              role="Authorized By"
              onSign={setAuthorizerSig}
              savedSignature={authorizerSig}
              disabled={isAuthorizerDisabled}
            />
          </div>
        </div>
      </div>
    </FormWrapper>
  );
};

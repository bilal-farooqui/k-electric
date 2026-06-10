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

export const LineIsolation: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-LI-06';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [feederName, setFeederName] = useState('Feeder Clifton 11kV - B');
  const [voltage, setVoltage] = useState('11 kV');
  const [isolatingSubstation, setIsolatingSubstation] = useState('Clifton Grid Station');
  const [requestSection, setRequestSection] = useState('Distribution Operations Division');
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    breakerOff: false,
    breakerRacked: false,
    isolatorOpen: false,
    redTagPlaced: false,
    earthSwitchClosed: false,
    dischargeVerified: false,
  });

  const [issuerSig, setIssuerSig] = useState('');
  const [receiverSig, setReceiverSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setFeederName(data.feederName || '');
        setVoltage(data.voltage || '11 kV');
        setIsolatingSubstation(data.isolatingSubstation || '');
        setRequestSection(data.requestSection || '');
        setChecklist(data.checklist || {});
        setIssuerSig(data.issuerSig || '');
        setReceiverSig(data.receiverSig || '');
      }
    } else {
      setPermitId(`KE-LI-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setFeederName('Feeder Clifton 11kV - B');
      setVoltage('11 kV');
      setIsolatingSubstation('Clifton Grid Station');
      setRequestSection('Distribution Operations Division');
      setChecklist({
        breakerOff: false,
        breakerRacked: false,
        isolatorOpen: false,
        redTagPlaced: false,
        earthSwitchClosed: false,
        dischargeVerified: false,
      });
      setIssuerSig('');
      setReceiverSig('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'line-isolation',
      title: 'Line Isolation PTW',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || 'Grid Isolation Engineer',
      formData: {
        feederName,
        voltage,
        isolatingSubstation,
        requestSection,
        checklist,
        issuerSig,
        receiverSig,
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
      alert('Please fill out feeder and grid station parameters.');
      return;
    }

    if (!issuerSig || !receiverSig) {
      alert('BOTH Control Room Issuer AND Site Receiver signatures are required for isolation authorization.');
      return;
    }

    const allChecked = Object.values(checklist).every((val) => val === true);
    const finalStatus = allChecked ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'line-isolation',
      title: 'Line Isolation PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || 'Grid Isolation Engineer',
      approvedBy: finalStatus === 'approved' ? 'Control Room Supervisor' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        feederName,
        voltage,
        isolatingSubstation,
        requestSection,
        checklist,
        issuerSig,
        receiverSig,
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
        ? 'Line Isolation authorized! Feeder has been safely de-energized.'
        : 'Warning: Not all electrical isolation controls were verified. Marked as Pending.'
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
    { key: 'breakerOff', label: 'Circuit Breaker Switched OFF', tooltip: 'Turn off the main oil/vacuum circuit breaker in the switchgear panel.' },
    { key: 'breakerRacked', label: 'Breaker Racked Out (Disconnected)', tooltip: 'Physically rack out the breaker unit to create a visible air gap disconnection.' },
    { key: 'isolatorOpen', label: 'Isolator Switch Open & Padlocked', tooltip: 'Open the line isolator and apply LOTO (Lockout Tagout) padlocks.' },
    { key: 'redTagPlaced', label: 'Danger Board / Red Tag Applied', tooltip: 'Hang a Red Tag reading: "DO NOT OPERATE - WORKERS ON LINE".' },
    { key: 'earthSwitchClosed', label: 'Earth Switch Closed / Ground Applied', tooltip: 'Close the earthing switch or connect a portable ground copper lead to earth.' },
    { key: 'dischargeVerified', label: 'Tested Dead (Voltage Checked)', tooltip: 'Use a high-voltage detection stick to verify zero residual line charge.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="High-Voltage Electrical Isolation Permit"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: METADATA */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Scope of Electrical Isolation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FEEDER / CIRCUIT ID</label>
            <input
              type="text"
              value={feederName}
              onChange={(e) => setFeederName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">VOLTAGE RATING</label>
            <select
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option>11 kV</option>
              <option>33 kV</option>
              <option>132 kV</option>
              <option>400 V LT</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">ISOLATING GRID SUBSTATION</label>
            <input
              type="text"
              value={isolatingSubstation}
              onChange={(e) => setIsolatingSubstation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">REQUESTING OPERATIONS SECTION</label>
            <input
              type="text"
              value={requestSection}
              onChange={(e) => setRequestSection(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ISOLATION PROTOCOLS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Safety Isolation checklist (LOTO)
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
                    : 'bg-gray-105 border border-gray-300 text-gray-650 hover:bg-gray-200'
                }`}
              >
                {checklist[item.key] ? 'Isolated' : 'Open / Energized'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: DUAL SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Isolation Issuance & Receipt Authorization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. PERMIT ISSUER (CONTROL ROOM)"
            role="Control Room Isolation Officer"
            onSign={setIssuerSig}
            savedSignature={issuerSig}
            disabled={isDisabled}
          />

          <SignaturePad
            label="2. PERMIT RECEIVER (SITE WORK)"
            role="Site Crew Leader / Lineman"
            onSign={setReceiverSig}
            savedSignature={receiverSig}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

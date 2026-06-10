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

export const FaultExcavation: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-FE-05';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [ticketId, setTicketId] = useState('');
  const [substation, setSubstation] = useState('Substation Clifton A');
  const [feederName, setFeederName] = useState('K-Feeder 3');
  const [cableType, setCableType] = useState('HT (11kV)');
  const [locationAddress, setLocationAddress] = useState('');
  const [gpsCoords, setGpsCoords] = useState('');
  
  const [excavationNeeded, setExcavationNeeded] = useState<'yes' | 'no'>('yes');
  const [trenchDepth, setTrenchDepth] = useState('1.0');
  const [trenchWidth, setTrenchWidth] = useState('0.6');
  const [trenchLength, setTrenchLength] = useState('5.0');
  
  const [surveyChecks, setSurveyChecks] = useState<Record<string, boolean>>({
    markersVerified: false,
    gasClearance: false,
    telecomClearance: false,
    waterClearance: false,
  });

  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setTicketId(data.ticketId || '');
        setSubstation(data.substation || '');
        setFeederName(data.feederName || '');
        setCableType(data.cableType || 'HT (11kV)');
        setLocationAddress(data.locationAddress || '');
        setGpsCoords(data.gpsCoords || '');
        setExcavationNeeded(data.excavationNeeded || 'yes');
        setTrenchDepth(data.trenchDepth || '1.0');
        setTrenchWidth(data.trenchWidth || '0.6');
        setTrenchLength(data.trenchLength || '5.0');
        setSurveyChecks(data.surveyChecks || {});
        setSignature(data.signature || '');
      }
    } else {
      setPermitId(`KE-FE-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setTicketId('');
      setSubstation('Substation Clifton A');
      setFeederName('K-Feeder 3');
      setCableType('HT (11kV)');
      setLocationAddress('');
      setGpsCoords('');
      setExcavationNeeded('yes');
      setTrenchDepth('1.0');
      setTrenchWidth('0.6');
      setTrenchLength('5.0');
      setSurveyChecks({
        markersVerified: false,
        gasClearance: false,
        telecomClearance: false,
        waterClearance: false,
      });
      setSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setSurveyChecks((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'fault-excavation',
      title: 'Fault / Excavation Request Form',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || 'Maintenance Supervisor',
      formData: {
        ticketId,
        substation,
        feederName,
        cableType,
        locationAddress,
        gpsCoords,
        excavationNeeded,
        trenchDepth,
        trenchWidth,
        trenchLength,
        surveyChecks,
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

    if (!ticketId || !locationAddress || !gpsCoords) {
      alert('Please fill out Ticket ID, Location, and GPS Coordinates.');
      return;
    }

    if (!signature) {
      alert('A digital signature or authorization stamp is required to submit.');
      return;
    }

    const allClear = Object.values(surveyChecks).every((val) => val === true);
    const finalStatus = (excavationNeeded === 'yes' && !allClear) ? 'pending' : 'approved';

    const newPermit: Permit = {
      id: permitId,
      type: 'fault-excavation',
      title: 'Fault / Excavation Request Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: currentUser?.name || 'Maintenance Supervisor',
      approvedBy: finalStatus === 'approved' ? 'Substation Control Desk' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        ticketId,
        substation,
        feederName,
        cableType,
        locationAddress,
        gpsCoords,
        excavationNeeded,
        trenchDepth,
        trenchWidth,
        trenchLength,
        surveyChecks,
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
      finalStatus === 'approved'
        ? 'Fault/Excavation Request approved!'
        : 'Clearance utilities checks missing. Awaiting Civil Desk authorization.'
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
    { key: 'markersVerified', label: 'Physical Cable Route Markers Verified', tooltip: 'Verify concrete markers on street align with cable map layout.' },
    { key: 'gasClearance', label: 'SSGC Gas Pipeline Clearance Verified', tooltip: 'Verify no active gas line runs directly below excavation layout.' },
    { key: 'telecomClearance', label: 'PTCL Fiber / Telecom Service Clearance', tooltip: 'Ensure telecom lines are safe from bucket excavator reach.' },
    { key: 'waterClearance', label: 'KWSB Water Pipeline Drawings Checked', tooltip: 'Check that water main pipes will not be compromised.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Receiving Fault / Excavation Request"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.role === 'Principal Safety Officer'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: FAULT DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Fault Ticket & Cable Metadata
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT TICKET ID</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g. F-938204"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">GRID SUBSTATION</label>
            <input
              type="text"
              value={substation}
              onChange={(e) => setSubstation(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FEEDER / CIRCUIT NAME</label>
            <input
              type="text"
              value={feederName}
              onChange={(e) => setFeederName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">CABLE TYPE</label>
            <select
              value={cableType}
              onChange={(e) => setCableType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option>HT (11kV)</option>
              <option>HT (33kV)</option>
              <option>LT (400V)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-550 block mb-1">FAULT STREET ADDRESS</label>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="e.g. Plot 43C, Lane 6, DHA Phase 5"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">GPS COORDINATES</label>
            <input
              type="text"
              value={gpsCoords}
              onChange={(e) => setGpsCoords(e.target.value)}
              placeholder="e.g. 24.8607° N, 67.0011° E"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: EXCAVATION SCOPE */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Excavation Dimension Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">EXCAVATION REQUIRED?</label>
            <select
              value={excavationNeeded}
              onChange={(e) => setExcavationNeeded(e.target.value as 'yes' | 'no')}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {excavationNeeded === 'yes' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-550 block mb-1">TRENCH DEPTH (M)</label>
                <input
                  type="number"
                  step="0.1"
                  value={trenchDepth}
                  onChange={(e) => setTrenchDepth(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-550 block mb-1">TRENCH WIDTH (M)</label>
                <input
                  type="number"
                  step="0.1"
                  value={trenchWidth}
                  onChange={(e) => setTrenchWidth(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-550 block mb-1">TRENCH LENGTH (M)</label>
                <input
                  type="number"
                  step="0.1"
                  value={trenchLength}
                  onChange={(e) => setTrenchLength(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
                  disabled={isDisabled}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 3: SURVEY CLEARANCE */}
      {excavationNeeded === 'yes' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
            III. Third-Party Utilities Clearance Survey
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
                    surveyChecks[item.key]
                      ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                      : 'bg-gray-105 border border-gray-300 text-gray-650 hover:bg-gray-200'
                  }`}
                >
                  {surveyChecks[item.key] ? 'Cleared' : 'Pending'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          IV. Maintenance Supervisor Stamp
        </h3>

        <div className="max-w-md">
          <SignaturePad
            label="SUPERVISOR SIGN-OFF"
            role="Fault Operations Supervisor"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

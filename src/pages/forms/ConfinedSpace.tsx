import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import type { Permit, PermitStatus } from '../../types/ptw';
import { AlertCircle } from 'lucide-react';

interface FormProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: any;
}

export const ConfinedSpace: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-CS-08';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Entry Information
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [purposeOfEntry, setPurposeOfEntry] = useState('');

  // Atmospheric Testing
  const [oxygenLevel, setOxygenLevel] = useState('20.9');
  const [toxicGasLevel, setToxicGasLevel] = useState('0');
  const [flammableGasLevel, setFlammableGasLevel] = useState('0');

  // Safety Requirements checklist
  const [safetyChecklist, setSafetyChecklist] = useState<Record<string, boolean>>({
    ventilationAvailable: false,
    gasDetectorAvailable: false,
    rescueEquipmentAvailable: false,
    harnessUsed: false,
  });

  // Personnel
  const [authorizedEntrants, setAuthorizedEntrants] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');

  // Emergency Preparedness checklist
  const [emergencyChecklist, setEmergencyChecklist] = useState<Record<string, boolean>>({
    rescueTeamInformed: false,
    emergencyContactAvailable: false,
  });

  // Signatures
  const [gasTesterSig, setGasTesterSig] = useState('');
  const [supervisorSig, setSupervisorSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const d = existing.formData;
      if (d) {
        setDate(d.date || new Date().toISOString().split('T')[0]);
        setLocation(d.location || '');
        setPurposeOfEntry(d.purposeOfEntry || '');
        setOxygenLevel(d.oxygenLevel || '20.9');
        setToxicGasLevel(d.toxicGasLevel || '0');
        setFlammableGasLevel(d.flammableGasLevel || '0');
        setSafetyChecklist(d.safetyChecklist || {});
        setAuthorizedEntrants(d.authorizedEntrants || '');
        setEntryTime(d.entryTime || '');
        setExitTime(d.exitTime || '');
        setEmergencyChecklist(d.emergencyChecklist || {});
        setGasTesterSig(d.gasTesterSig || '');
        setSupervisorSig(d.supervisorSig || '');
        setApproverSignature(d.approverSignature || '');
      }
    } else {
      setPermitId(`KE-CS-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setDate(new Date().toISOString().split('T')[0]);
      setLocation('');
      setPurposeOfEntry('');
      setOxygenLevel('20.9');
      setToxicGasLevel('0');
      setFlammableGasLevel('0');
      setSafetyChecklist({ ventilationAvailable: false, gasDetectorAvailable: false, rescueEquipmentAvailable: false, harnessUsed: false });
      setAuthorizedEntrants(currentUser?.name || '');
      setEntryTime('');
      setExitTime('');
      setEmergencyChecklist({ rescueTeamInformed: false, emergencyContactAvailable: false });
      setGasTesterSig('');
      setSupervisorSig('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleSafety = (key: string) =>
    setSafetyChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleEmergency = (key: string) =>
    setEmergencyChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const validateAtmosphere = () => {
    const o2 = parseFloat(oxygenLevel);
    const toxic = parseFloat(toxicGasLevel);
    const flam = parseFloat(flammableGasLevel);
    const o2Ok = o2 >= 19.5 && o2 <= 23.5;
    const toxicOk = toxic < 10;
    const flamOk = flam < 10;
    return { allOk: o2Ok && toxicOk && flamOk, o2Ok, toxicOk, flamOk };
  };

  const buildFormData = () => ({
    date,
    location,
    purposeOfEntry,
    oxygenLevel,
    toxicGasLevel,
    flammableGasLevel,
    safetyChecklist,
    authorizedEntrants,
    entryTime,
    exitTime,
    emergencyChecklist,
    gasTesterSig,
    supervisorSig,
    approverSignature,
  });

  const saveToStore = (permit: Permit) => {
    const index = permits.findIndex((p) => p.id === permitId);
    const updated = index > -1 ? permits.map((p, i) => (i === index ? permit : p)) : [permit, ...permits];
    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
    return updated;
  };

  const handleSaveDraft = () => {
    saveToStore({
      id: permitId,
      type: 'confined-space',
      title: 'Confined Space PTW',
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: authorizedEntrants,
      formData: buildFormData(),
    });
    alert('Draft saved successfully!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !purposeOfEntry || !authorizedEntrants) {
      alert('Please fill out Location, Purpose of Entry, and Authorized Entrants.');
      return;
    }

    if (!gasTesterSig || !supervisorSig) {
      alert('BOTH Gas Tester AND Entry Supervisor signatures are required to authorize entry.');
      return;
    }

    const atmosphere = validateAtmosphere();
    if (!atmosphere.allOk) {
      alert('CRITICAL SAFETY ALERT: Atmospheric levels are outside safe limits. Entry is forbidden until levels normalize.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    saveToStore({
      id: permitId,
      type: 'confined-space',
      title: 'Confined Space PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: authorizedEntrants,
      formData: buildFormData(),
    });
    setStatus(finalStatus);
    alert('Permit submitted successfully and is now pending safety officer review.');
    navigate('/');
  };

  const handleApprove = (approverSig: string) => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    saveToStore({
      ...existing,
      status: 'APPROVED',
      approvedBy: `${currentUser?.name || 'Admin'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
      },
    });
    setStatus('APPROVED');
    setApproverSignature(approverSig);
    alert('Permit approved successfully!');
    navigate('/admin');
  };

  const handleReject = (approverSig: string) => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    saveToStore({
      ...existing,
      status: 'REJECTED',
      formData: {
        ...existing.formData,
        approverSignature: approverSig,
      },
    });
    setStatus('REJECTED');
    setApproverSignature(approverSig);
    alert('Permit rejected.');
    navigate('/admin');
  };

  const atmosphere = validateAtmosphere();
  const isDisabled = status !== 'DRAFT';

  const sectionHeader = (label: string) => (
    <div
      style={{
        color: '#1e3a5f',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
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
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          checked
            ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
            : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
        }`}
      >
        {checked ? '✓ Yes' : '✗ No'}
      </button>
    </div>
  );

  return (
    <FormWrapper
      title="Confined Space / Manhole Entry Permit"
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
        This PTW is applicable when work is performed in confined or restricted spaces such as trenches
        deeper than 4 ft, manholes, chambers, vaults, or underground cable pits.
      </div>

      {/* SECTION 1: ENTRY INFORMATION */}
      <div className="space-y-3">
        {sectionHeader('Entry Information')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Permit Number</label>
            <input
              type="text"
              value={permitId}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono outline-none"
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
            <label className="text-xs font-bold text-gray-700 block mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. MH-CLIF-8392, Phase 6 DHA"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Purpose of Entry</label>
            <input
              type="text"
              value={purposeOfEntry}
              onChange={(e) => setPurposeOfEntry(e.target.value)}
              placeholder="e.g. Cable inspection and jointing"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ATMOSPHERIC TESTING */}
      <div className="space-y-3">
        {sectionHeader('Atmospheric Testing')}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-600 block mb-1">
              Oxygen Level (O₂) — %
            </label>
            <input
              type="number"
              step="0.1"
              value={oxygenLevel}
              onChange={(e) => setOxygenLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                atmosphere.o2Ok
                  ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500'
                  : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-600 mt-1 block text-center font-mono">
              Safe: 19.5% – 23.5%
            </span>
          </div>

          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-600 block mb-1">
              Toxic Gas Level (H₂S/CO) — PPM
            </label>
            <input
              type="number"
              value={toxicGasLevel}
              onChange={(e) => setToxicGasLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                atmosphere.toxicOk
                  ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500'
                  : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-600 mt-1 block text-center font-mono">
              Safe: &lt; 10 PPM
            </span>
          </div>

          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-600 block mb-1">
              Flammable Gas Level (CH₄/LEL) — %
            </label>
            <input
              type="number"
              value={flammableGasLevel}
              onChange={(e) => setFlammableGasLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                atmosphere.flamOk
                  ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500'
                  : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-600 mt-1 block text-center font-mono">
              Safe: &lt; 10% LEL
            </span>
          </div>
        </div>

        {!atmosphere.allOk && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-650 mt-0.5 animate-bounce" />
            <div>
              <div className="text-xs font-bold tracking-wider">Atmospheric Hazard Present</div>
              <div className="text-xs mt-0.5 font-medium">
                One or more gas levels are outside safe limits. Forced ventilation must continue. Entry is forbidden.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: SAFETY REQUIREMENTS */}
      <div className="space-y-3">
        {sectionHeader('Safety Requirements')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckToggle
            checked={safetyChecklist.ventilationAvailable}
            onToggle={() => toggleSafety('ventilationAvailable')}
            label="Ventilation Available"
            tooltip="Forced air blower must be active for at least 15 minutes prior to entry."
          />
          <CheckToggle
            checked={safetyChecklist.gasDetectorAvailable}
            onToggle={() => toggleSafety('gasDetectorAvailable')}
            label="Gas Detector Available"
            tooltip="A calibrated multi-gas detector must be present and functional on site."
          />
          <CheckToggle
            checked={safetyChecklist.rescueEquipmentAvailable}
            onToggle={() => toggleSafety('rescueEquipmentAvailable')}
            label="Rescue Equipment Available"
            tooltip="Retrieval tripod, winch, and lifeline must be set up and verified above the entry point."
          />
          <CheckToggle
            checked={safetyChecklist.harnessUsed}
            onToggle={() => toggleSafety('harnessUsed')}
            label="Harness Used"
            tooltip="All entrants must wear a full-body safety harness connected to the lifeline at all times."
          />
        </div>
      </div>

      {/* SECTION 4: PERSONNEL */}
      <div className="space-y-3">
        {sectionHeader('Personnel')}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Authorized Entrants</label>
            <input
              type="text"
              value={authorizedEntrants}
              onChange={(e) => setAuthorizedEntrants(e.target.value)}
              placeholder="Full name(s) of authorized entrants"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Entry Time</label>
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Exit Time</label>
            <input
              type="time"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: EMERGENCY PREPAREDNESS */}
      <div className="space-y-3">
        {sectionHeader('Emergency Preparedness')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckToggle
            checked={emergencyChecklist.rescueTeamInformed}
            onToggle={() => toggleEmergency('rescueTeamInformed')}
            label="Rescue Team Informed"
            tooltip="The designated rescue team has been briefed and is on standby for the duration of confined space entry."
          />
          <CheckToggle
            checked={emergencyChecklist.emergencyContactAvailable}
            onToggle={() => toggleEmergency('emergencyContactAvailable')}
            label="Emergency Contact Available"
            tooltip="An emergency contact number is posted at the entry point and all personnel are aware of it."
          />
        </div>
      </div>

      {/* SECTION 6: SIGNATURES */}
      <div className="space-y-3">
        {sectionHeader('Multi-Officer Entry Clearance Authorization')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. Certified Gas Tester"
            role="Authorized Gas Tester"
            onSign={setGasTesterSig}
            savedSignature={gasTesterSig}
            disabled={isDisabled}
          />
          <SignaturePad
            label="2. Entry Supervisor"
            role="Site Entry Supervisor"
            onSign={setSupervisorSig}
            savedSignature={supervisorSig}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

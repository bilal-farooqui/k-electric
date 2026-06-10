import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import type { Permit } from '../../types/ptw';
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
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [manholeId, setManholeId] = useState('MH-CLIF-8392');
  const [entrySupervisor, setEntrySupervisor] = useState('');
  const [standbyWatcher, setStandbyWatcher] = useState('Dilawar Shah');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Gas test measurements
  const [oxygenLevel, setOxygenLevel] = useState('20.9'); // Norm: 19.5% - 23.5%
  const [h2sLevel, setH2sLevel] = useState('0'); // Norm: < 10 ppm
  const [coLevel, setCoLevel] = useState('0'); // Norm: < 35 ppm
  const [lelLevel, setLelLevel] = useState('0'); // Norm: < 10%
  const [gasTesterName, setGasTesterName] = useState('Tariq Mahmood');

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    ventilationActive: false,
    harnessWorn: false,
    tripodSetup: false,
    watcherTrained: false,
    gasMonitorContinuous: false,
  });

  const [gasTesterSig, setGasTesterSig] = useState('');
  const [supervisorSig, setSupervisorSig] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setManholeId(data.manholeId || '');
        setEntrySupervisor(data.entrySupervisor || '');
        setStandbyWatcher(data.standbyWatcher || '');
        setEntryDate(data.entryDate || '');
        setOxygenLevel(data.oxygenLevel || '20.9');
        setH2sLevel(data.h2sLevel || '0');
        setCoLevel(data.coLevel || '0');
        setLelLevel(data.lelLevel || '0');
        setGasTesterName(data.gasTesterName || '');
        setChecklist(data.checklist || {});
        setGasTesterSig(data.gasTesterSig || '');
        setSupervisorSig(data.supervisorSig || '');
      }
    } else {
      setPermitId(`KE-CS-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setManholeId('MH-CLIF-8392');
      setEntrySupervisor(currentUser?.name || '');
      setStandbyWatcher('Dilawar Shah');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setOxygenLevel('20.9');
      setH2sLevel('0');
      setCoLevel('0');
      setLelLevel('0');
      setGasTesterName('Tariq Mahmood');
      setChecklist({
        ventilationActive: false,
        harnessWorn: false,
        tripodSetup: false,
        watcherTrained: false,
        gasMonitorContinuous: false,
      });
      setGasTesterSig('');
      setSupervisorSig('');
    }
  }, [permits, editId, currentUser]);

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'confined-space',
      title: 'Confined Space PTW',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: entrySupervisor,
      formData: {
        manholeId,
        entrySupervisor,
        standbyWatcher,
        entryDate,
        oxygenLevel,
        h2sLevel,
        coLevel,
        lelLevel,
        gasTesterName,
        checklist,
        gasTesterSig,
        supervisorSig,
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

  const validateGases = () => {
    const o2 = parseFloat(oxygenLevel);
    const h2s = parseFloat(h2sLevel);
    const co = parseFloat(coLevel);
    const lel = parseFloat(lelLevel);

    const o2Ok = o2 >= 19.5 && o2 <= 23.5;
    const h2sOk = h2s < 10;
    const coOk = co < 35;
    const lelOk = lel < 10;

    return {
      allOk: o2Ok && h2sOk && coOk && lelOk,
      o2Ok,
      h2sOk,
      coOk,
      lelOk,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manholeId || !entrySupervisor || !standbyWatcher) {
      alert('Please fill out Location/Manhole ID and Supervisor/Standby Watcher names.');
      return;
    }

    if (!gasTesterSig || !supervisorSig) {
      alert('BOTH Gas Tester AND Entry Supervisor signatures are required to authorize entry.');
      return;
    }

    const gasReport = validateGases();
    const allControlsChecked = Object.values(checklist).every((val) => val === true);
    
    if (!gasReport.allOk) {
      alert('CRITICAL SAFETY DETECTED: Gas levels are OUTSIDE safe atmospheric limits. Under no circumstances can entry be allowed.');
      return;
    }

    const finalStatus = allControlsChecked ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'confined-space',
      title: 'Confined Space PTW',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: entrySupervisor,
      approvedBy: finalStatus === 'approved' ? 'Lead Industrial Safety Engineer' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        manholeId,
        entrySupervisor,
        standbyWatcher,
        entryDate,
        oxygenLevel,
        h2sLevel,
        coLevel,
        lelLevel,
        gasTesterName,
        checklist,
        gasTesterSig,
        supervisorSig,
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
      allControlsChecked
        ? 'Confined Space Entry Permit approved! Access is authorized.'
        : 'Safety equipment checks missing. Permit set to Pending review.'
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

  const gasReport = validateGases();

  const items = [
    { key: 'ventilationActive', label: 'Forced Mechanical Ventilation Active', tooltip: 'Forced air blower active for at least 15 minutes prior to entry.' },
    { key: 'harnessWorn', label: 'Safety Harness & Lifeline Worn', tooltip: 'Entry team must wear a full-body harness connected to a lifeline cable.' },
    { key: 'tripodSetup', label: 'Retrieval Tripod and Winch Placed', tooltip: 'Verify recovery tripod hoist is locked above the manhole entry point.' },
    { key: 'watcherTrained', label: 'Standby Watchman Stationary at Entrance', tooltip: 'Watcher must remain at the opening, maintain communication, and never enter the space.' },
    { key: 'gasMonitorContinuous', label: 'Continuous Personal Gas Detector Active', tooltip: 'Entrants must wear a multi-gas monitor configured to beep/vibrate on threshold.' },
  ];

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

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
    >
      {/* SECTION 1: METADATA */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          I. Entry Control Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">MANHOLE / CHAMBER ID</label>
            <input
              type="text"
              value={manholeId}
              onChange={(e) => setManholeId(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">ENTRY SUPERVISOR</label>
            <input
              type="text"
              value={entrySupervisor}
              onChange={(e) => setEntrySupervisor(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">STANDBY WATCHER (SAFETY LOOKOUT)</label>
            <input
              type="text"
              value={standbyWatcher}
              onChange={(e) => setStandbyWatcher(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">ENTRY DATE</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ATMOSPHERIC GAS MEASUREMENTS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Pre-Entry Gas Concentration Levels
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-450 block uppercase mb-1">OXYGEN (O₂) LEVEL (%)</label>
            <input
              type="number"
              step="0.1"
              value={oxygenLevel}
              onChange={(e) => setOxygenLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                gasReport.o2Ok ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500' : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-400 mt-1 block text-center font-mono">Norm: 19.5% - 23.5%</span>
          </div>

          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-450 block uppercase mb-1">HYDROGEN SULFIDE (H₂S) (PPM)</label>
            <input
              type="number"
              value={h2sLevel}
              onChange={(e) => setH2sLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                gasReport.h2sOk ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500' : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-400 mt-1 block text-center font-mono">Norm: &lt; 10 PPM</span>
          </div>

          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-450 block uppercase mb-1">CARBON MONOXIDE (CO) (PPM)</label>
            <input
              type="number"
              value={coLevel}
              onChange={(e) => setCoLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                gasReport.coOk ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500' : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-400 mt-1 block text-center font-mono">Norm: &lt; 35 PPM</span>
          </div>

          <div className="p-4 bg-white border border-gray-250 rounded-xl shadow-xs">
            <label className="text-[10px] font-bold text-gray-450 block uppercase mb-1">METHANE (CH₄ / LEL) (%)</label>
            <input
              type="number"
              value={lelLevel}
              onChange={(e) => setLelLevel(e.target.value)}
              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-base font-mono font-bold text-center outline-none ${
                gasReport.lelOk ? 'border-emerald-300 text-emerald-700 focus:border-emerald-500' : 'border-red-300 text-red-700 focus:border-red-500 bg-red-50 animate-pulse'
              }`}
              disabled={isDisabled}
            />
            <span className="text-[9px] text-gray-400 mt-1 block text-center font-mono">Norm: &lt; 10% LEL</span>
          </div>
        </div>

        {!gasReport.allOk && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-650 mt-0.5 animate-bounce" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Atmospheric Hazard Present</div>
              <div className="text-xs mt-0.5 font-medium">One or more gas metrics have exceeded safe exposure limits. Forced ventilation must continue. Entry is forbidden.</div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Safety Protective Systems Checklist
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

      {/* SECTION 4: SIGNATURES */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          IV. Multi-Officer Entry Clearance Authorization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label="1. CERTIFIED GAS TESTER"
            role="Authorized Gas Tester"
            onSign={setGasTesterSig}
            savedSignature={gasTesterSig}
            disabled={isDisabled}
          />

          <SignaturePad
            label="2. ENTRY SUPERVISOR"
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

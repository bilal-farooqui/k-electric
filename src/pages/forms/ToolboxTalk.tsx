import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import type { Permit } from '../../types/ptw';
import { Plus, Trash2 } from 'lucide-react';

interface FormProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: any;
}

export const ToolboxTalk: React.FC<FormProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const formCode = 'KE-PTW-TBT-04';

  const [permitId, setPermitId] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Form State
  const [supervisorName, setSupervisorName] = useState('');
  const [talkDate, setTalkDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Feeder 11kV - Clifton block 4');
  const [workOrderId, setWorkOrderId] = useState('');
  
  const [hazards, setHazards] = useState<Record<string, boolean>>({
    shock: false,
    heights: false,
    overhead: false,
    trips: false,
    machinery: false,
    cavein: false,
    heat: false,
  });

  const [mitigations, setMitigations] = useState<Record<string, boolean>>({
    ppe: false,
    testdead: false,
    barriers: false,
    earth: false,
    watcher: false,
  });

  const [crew, setCrew] = useState<Array<{ name: string; designation: string; signed: boolean }>>([
    { name: 'Arif Khan', designation: 'Lineman I', signed: true },
    { name: 'Sajid Ali', designation: 'Lineman II', signed: true },
  ]);

  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status);
      const data = existing.formData;
      if (data) {
        setSupervisorName(data.supervisorName || '');
        setTalkDate(data.talkDate || '');
        setLocation(data.location || '');
        setWorkOrderId(data.workOrderId || '');
        setHazards(data.hazards || {});
        setMitigations(data.mitigations || {});
        setCrew(data.crew || []);
        setSignature(data.signature || '');
      }
    } else {
      setPermitId(`KE-TBT-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
      setSupervisorName(currentUser?.name || '');
      setTalkDate(new Date().toISOString().split('T')[0]);
      setLocation('Feeder 11kV - Clifton block 4');
      setWorkOrderId('');
      setHazards({
        shock: false,
        heights: false,
        overhead: false,
        trips: false,
        machinery: false,
        cavein: false,
        heat: false,
      });
      setMitigations({
        ppe: false,
        testdead: false,
        barriers: false,
        earth: false,
        watcher: false,
      });
      setCrew([
        { name: 'Arif Khan', designation: 'Lineman I', signed: true },
        { name: 'Sajid Ali', designation: 'Lineman II', signed: true },
      ]);
      setSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleHazard = (key: string) => {
    setHazards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMitigation = (key: string) => {
    setMitigations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddCrew = () => {
    setCrew([...crew, { name: '', designation: 'Assistant Lineman', signed: false }]);
  };

  const handleRemoveCrew = (idx: number) => {
    const next = [...crew];
    next.splice(idx, 1);
    setCrew(next);
  };

  const handleCrewChange = (idx: number, field: 'name' | 'designation' | 'signed', val: any) => {
    const next = [...crew];
    next[idx] = { ...next[idx], [field]: val };
    setCrew(next);
  };

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'site-tbt',
      title: 'Site TBT (Toolbox Talk) Form',
      status: 'draft',
      createdAt: new Date().toLocaleString(),
      submittedBy: supervisorName,
      formData: {
        supervisorName,
        talkDate,
        location,
        workOrderId,
        hazards,
        mitigations,
        crew,
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

    if (!workOrderId || !location || !supervisorName) {
      alert('Please fill out all basic information fields.');
      return;
    }

    if (!signature) {
      alert('A digital signature or authorization stamp is required to submit.');
      return;
    }

    const hasCrewUnsigned = crew.some((c) => !c.signed || !c.name.trim());
    if (hasCrewUnsigned) {
      alert('Ensure all crew members are listed by name and have checked the Sign-off indicator.');
      return;
    }

    const anyHazardChecked = Object.values(hazards).some((val) => val === true);
    const anyMitigationChecked = Object.values(mitigations).some((val) => val === true);
    
    const finalStatus = (anyHazardChecked && !anyMitigationChecked) ? 'pending' : 'approved';

    const newPermit: Permit = {
      id: permitId,
      type: 'site-tbt',
      title: 'Site TBT (Toolbox Talk) Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: supervisorName,
      approvedBy: finalStatus === 'approved' ? 'TBT Supervisor Verification' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
      formData: {
        supervisorName,
        talkDate,
        location,
        workOrderId,
        hazards,
        mitigations,
        crew,
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
    alert('Toolbox Talk documented and approved!');
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

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.role === 'Principal Safety Officer' && status === 'pending');

  return (
    <FormWrapper
      title="Site Toolbox Talk (TBT) Briefing"
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
          I. Site & Talk Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">SUPERVISOR / LEAD CONDUCTING TBT</label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">DATE OF BRIEFING</label>
            <input
              type="date"
              value={talkDate}
              onChange={(e) => setTalkDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">FEEDER NAME / LOCATION</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
        </div>
      </div>

      {/* SECTION 2: HAZARD RECOGNITION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          II. Job Hazard Identification (JHA)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'shock', label: 'Electrical Shock / Flash' },
            { key: 'heights', label: 'Fall From Heights (>1.8m)' },
            { key: 'overhead', label: 'Overhead Lines Contact' },
            { key: 'trips', label: 'Slips / Trips / Falls' },
            { key: 'machinery', label: 'Heavy Crane Operation' },
            { key: 'cavein', label: 'Excavation Trench Cave-in' },
            { key: 'heat', label: 'Heat Stroke / Open Flames' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleHazard(item.key)}
              disabled={isDisabled}
              className={`p-3 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                hazards[item.key]
                  ? 'bg-red-50 border-red-500 text-red-800 shadow-sm'
                  : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
              }`}
            >
              <input
                type="checkbox"
                checked={!!hazards[item.key]}
                readOnly
                className="mr-2 accent-red-650"
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: MITIGATION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          III. Site Safety Controls & Mitigation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'ppe', label: 'Compulsory PPE worn by all crew', tooltip: 'Helmet, safety shoes, high-visibility vest' },
            { key: 'testdead', label: 'Verify absence of voltage (Test Dead)', tooltip: 'Use rated voltmeter/tester at site before beginning work.' },
            { key: 'barriers', label: 'Barricades & safety cones deployed', tooltip: 'Isolate area from traffic and pedestrians.' },
            { key: 'earth', label: 'Portable Grounding applied to cables', tooltip: 'Discharge capacitive electrical storage to ground.' },
            { key: 'watcher', label: 'Designate Safety Watcher (Standby Person)', tooltip: 'This person must monitor crew and never leave the site.' },
          ].map((item) => (
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
                onClick={() => toggleMitigation(item.key)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mitigations[item.key]
                    ? 'bg-emerald-600 border border-emerald-700 text-white shadow-sm'
                    : 'bg-gray-105 border border-gray-300 text-gray-655 hover:bg-gray-200'
                }`}
              >
                {mitigations[item.key] ? 'Applied' : 'Pending'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: ATTENDANCE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-150 pb-2">
          <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase">
            IV. Crew Attendance & Sign-off Roster
          </h3>
          {!isDisabled && (
            <button
              type="button"
              onClick={handleAddCrew}
              className="flex items-center gap-1.5 text-xs bg-brand-navy text-brand-accent px-3 py-1.5 rounded-lg border border-brand-accent/20 hover:bg-brand-primary transition-all font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Member
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="px-4 py-2.5">Crew Member Name</th>
                <th className="px-4 py-2.5">Role / Designation</th>
                <th className="px-4 py-2.5">Acknowledged Safety (Sign)</th>
                {!isDisabled && (
                  <th className="px-4 py-2.5 text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-150">
              {crew.map((member, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleCrewChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Arif Khan"
                      className="bg-transparent border-0 border-b border-transparent focus:border-brand-orange py-1 px-1.5 outline-none font-semibold text-brand-navy w-full"
                      disabled={isDisabled}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={member.designation}
                      onChange={(e) => handleCrewChange(idx, 'designation', e.target.value)}
                      className="bg-transparent border-0 outline-none w-full"
                      disabled={isDisabled}
                    >
                      <option>Lineman I</option>
                      <option>Lineman II</option>
                      <option>Assistant Lineman</option>
                      <option>Safety Watcher</option>
                      <option>Cable Jointer</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleCrewChange(idx, 'signed', !member.signed)}
                      disabled={isDisabled}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        member.signed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-350'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {member.signed ? 'Confirmed' : 'Sign Off'}
                    </button>
                  </td>
                  {!isDisabled && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveCrew(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1.5 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: SIGN-OFF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          V. TBT Supervisor Stamp
        </h3>

        <div className="max-w-md">
          <SignaturePad
            label="SUPERVISOR SIGN-OFF"
            role="Site Safety Supervisor"
            onSign={setSignature}
            savedSignature={signature}
            disabled={isDisabled}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

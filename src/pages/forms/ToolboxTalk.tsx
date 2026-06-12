import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import { Tooltip } from '../../components/Tooltip';
import type { Permit, PermitStatus } from '../../types/ptw';
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
  const [status, setStatus] = useState<PermitStatus>('DRAFT');
  const [approverSignature, setApproverSignature] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [siteLocation, setSiteLocation] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [teamLeader, setTeamLeader] = useState('');

  const [natureOfJob, setNatureOfJob] = useState('');
  const [hazardIdentification, setHazardIdentification] = useState('');
  const [riskLevel, setRiskLevel] = useState('Low');

  const [safetyDiscussion, setSafetyDiscussion] = useState<Record<string, boolean>>({
    electrical: false,
    excavation: false,
    traffic: false,
    ppe: false,
  });

  const [crew, setCrew] = useState<Array<{ name: string; designation: string; signed: boolean }>>([
    { name: '', designation: 'Lineman I', signed: false },
  ]);

  const [firstAidAvailable, setFirstAidAvailable] = useState(false);
  const [fireExtinguisherAvailable, setFireExtinguisherAvailable] = useState(false);
  
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setDate(data.date || '');
        setSiteLocation(data.siteLocation || '');
        setSupervisorName(data.supervisorName || '');
        setTeamLeader(data.teamLeader || '');
        setNatureOfJob(data.natureOfJob || '');
        setHazardIdentification(data.hazardIdentification || '');
        setRiskLevel(data.riskLevel || 'Low');
        setSafetyDiscussion(data.safetyDiscussion || {});
        setCrew(data.crew || []);
        setFirstAidAvailable(!!data.firstAidAvailable);
        setFireExtinguisherAvailable(!!data.fireExtinguisherAvailable);
        setSignature(data.signature || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-TBT-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setDate(new Date().toISOString().split('T')[0]);
      setSiteLocation('');
      setSupervisorName(currentUser?.name || '');
      setTeamLeader('');
      setNatureOfJob('');
      setHazardIdentification('');
      setRiskLevel('Low');
      setSafetyDiscussion({
        electrical: false,
        excavation: false,
        traffic: false,
        ppe: false,
      });
      setCrew([
        { name: '', designation: 'Lineman I', signed: false },
      ]);
      setFirstAidAvailable(false);
      setFireExtinguisherAvailable(false);
      setSignature('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const toggleDiscussion = (key: string) => {
    setSafetyDiscussion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddCrew = () => {
    setCrew([...crew, { name: '', designation: 'Lineman I', signed: false }]);
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
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: supervisorName,
      formData: {
        date,
        siteLocation,
        supervisorName,
        teamLeader,
        natureOfJob,
        hazardIdentification,
        riskLevel,
        safetyDiscussion,
        crew,
        firstAidAvailable,
        fireExtinguisherAvailable,
        signature,
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

    if (!siteLocation || !supervisorName || !teamLeader || !natureOfJob || !hazardIdentification) {
      alert('Please fill out all basic and work description details.');
      return;
    }

    if (!signature) {
      alert('Supervisor signature is required under Emergency Preparedness/Closure to submit.');
      return;
    }

    const hasCrewUnsigned = crew.some((c) => !c.signed || !c.name.trim());
    if (hasCrewUnsigned) {
      alert('Ensure all crew members are listed by name and have checked the Sign Off indicator.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      id: permitId,
      type: 'site-tbt',
      title: 'Site TBT (Toolbox Talk) Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: supervisorName,
      formData: {
        date,
        siteLocation,
        supervisorName,
        teamLeader,
        natureOfJob,
        hazardIdentification,
        riskLevel,
        safetyDiscussion,
        crew,
        firstAidAvailable,
        fireExtinguisherAvailable,
        signature,
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

  const isDisabled = status !== 'DRAFT';

  return (
    <FormWrapper
      title="4. SITE TBT (TOOLBOX TALK) FORM"
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
      {/* SECTION 1: BASIC DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Basic Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">TBT ID</label>
            <div className="w-full bg-gray-50 border border-gray-250 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
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
            <label className="text-xs font-bold text-gray-700 block mb-1">Site Location</label>
            <input
              type="text"
              required
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="e.g. Substation C, Trench 4"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Supervisor Name</label>
            <input
              type="text"
              required
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Team Leader</label>
            <input
              type="text"
              required
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
              placeholder="e.g. Arif Khan"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: WORK DESCRIPTION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Work Description
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Nature of Job</label>
            <input
              type="text"
              required
              value={natureOfJob}
              onChange={(e) => setNatureOfJob(e.target.value)}
              placeholder="e.g. Overhead cable restringing"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Hazard Identification</label>
            <input
              type="text"
              required
              value={hazardIdentification}
              onChange={(e) => setHazardIdentification(e.target.value)}
              placeholder="e.g. High voltage lines, traffic congestion"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 placeholder-gray-500"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-800 font-medium disabled:bg-gray-50 h-[38px]"
              disabled={isDisabled}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 3: SAFETY DISCUSSION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Safety Discussion
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'electrical', label: 'Electrical Hazard Discussed', tooltip: 'Live power line isolations, grounding, and warning tags.' },
            { key: 'excavation', label: 'Excavation Hazard Discussed', tooltip: 'Trench shoring, structural checks, underground cable bypass.' },
            { key: 'traffic', label: 'Traffic Hazard Discussed', tooltip: 'Safety cones, hi-vis jackets, traffic watchers.' },
            { key: 'ppe', label: 'PPE Requirements Explained', tooltip: 'Helmet, safety shoes, gloves insulation checks.' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleDiscussion(item.key)}
              disabled={isDisabled}
              className={`p-3.5 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                safetyDiscussion[item.key]
                  ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-sm'
                  : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!safetyDiscussion[item.key]}
                  readOnly
                  className="accent-emerald-650 font-bold"
                />
                {item.label}
              </span>
              <Tooltip content={item.tooltip} />
            </button>
          ))}
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 4: ATTENDANCE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-150 pb-2">
          <h3 className="text-xs font-bold text-brand-navy tracking-wider">
            Attendance
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
              <tr className="bg-gray-55 text-[10px] font-bold text-gray-600 border-b border-gray-200">
                <th className="px-4 py-2.5">Team Member Names</th>
                <th className="px-4 py-2.5">Signatures</th>
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
                      required
                      value={member.name}
                      onChange={(e) => handleCrewChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Arif Khan"
                      className="bg-transparent border-0 border-b border-transparent focus:border-brand-orange py-1 px-1.5 outline-none font-semibold text-brand-navy w-full text-gray-800 placeholder-gray-400"
                      disabled={isDisabled}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleCrewChange(idx, 'signed', !member.signed)}
                      disabled={isDisabled}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        member.signed
                          ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
                      }`}
                    >
                      {member.signed ? '✓ Confirmed' : '✗ Sign Off'}
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

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: EMERGENCY PREPAREDNESS & SUPERVISOR SIGN-OFF */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider border-b border-gray-150 pb-2">
          Emergency Preparedness
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFirstAidAvailable(!firstAidAvailable)}
            disabled={isDisabled}
            className={`p-3.5 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              firstAidAvailable
                ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={firstAidAvailable}
                readOnly
                className="accent-emerald-600 font-bold"
              />
              First Aid Available
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFireExtinguisherAvailable(!fireExtinguisherAvailable)}
            disabled={isDisabled}
            className={`p-3.5 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              fireExtinguisherAvailable
                ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fireExtinguisherAvailable}
                readOnly
                className="accent-emerald-600 font-bold"
              />
              Fire Extinguisher Available
            </span>
          </button>
        </div>

        <hr className="border-t border-gray-200 my-4" />

        <div className="space-y-4">
          <span className="text-xs font-bold text-brand-navy block tracking-wider">Supervisor Sign-Off</span>
          <div className="max-w-md">
            <SignaturePad
              label="Supervisor Signature"
              role="Conducting Supervisor"
              onSign={setSignature}
              savedSignature={signature}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
    </FormWrapper>
  );
};

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
      setStatus(existing.status);
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
      }
    } else {
      setPermitId(`KE-TBT-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('draft');
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
      status: 'draft',
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

    const finalStatus = (firstAidAvailable && fireExtinguisherAvailable) ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'site-tbt',
      title: 'Site TBT (Toolbox Talk) Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: supervisorName,
      approvedBy: finalStatus === 'approved' ? 'TBT Supervisor Self-Verification' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
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
        ? 'Toolbox Talk documented and approved!'
        : 'TBT submitted with preparedness concerns. Awaiting safety supervisor clearance.'
    );
    navigate('/');
  };

  const handleApprove = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'Safety Officer'} (${currentUser?.role || 'Safety Officer'})`,
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

  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.label === 'admin' && status === 'pending');

  return (
    <FormWrapper
      title="4. SITE TBT (TOOLBOX TALK) FORM"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.label === 'admin'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      {/* SECTION 1: BASIC DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          BASIC DETAILS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TBT ID</label>
            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 h-[38px] flex items-center">
              {permitId}
            </div>
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
            <label className="text-xs font-bold text-gray-550 block mb-1">SITE LOCATION</label>
            <input
              type="text"
              required
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="e.g. Substation C, Trench 4"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">SUPERVISOR NAME</label>
            <input
              type="text"
              required
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">TEAM LEADER</label>
            <input
              type="text"
              required
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
              placeholder="e.g. Arif Khan"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 2: WORK DESCRIPTION */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          WORK DESCRIPTION
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">NATURE OF JOB</label>
            <input
              type="text"
              required
              value={natureOfJob}
              onChange={(e) => setNatureOfJob(e.target.value)}
              placeholder="e.g. Overhead cable restringing"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-555 block mb-1">HAZARD IDENTIFICATION</label>
            <input
              type="text"
              required
              value={hazardIdentification}
              onChange={(e) => setHazardIdentification(e.target.value)}
              placeholder="e.g. High voltage lines, traffic congestion"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-550 block mb-1">RISK LEVEL</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-orange text-gray-700 font-medium disabled:bg-gray-50 h-[38px]"
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
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          SAFETY DISCUSSION
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
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!safetyDiscussion[item.key]}
                  readOnly
                  className="accent-emerald-605"
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
          <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase">
            ATTENDANCE
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
                <th className="px-4 py-2.5">Team Member Names</th>
                <th className="px-4 py-2.5">Role / Designation</th>
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
                      className="bg-transparent border-0 border-b border-transparent focus:border-brand-orange py-1 px-1.5 outline-none font-semibold text-brand-navy w-full"
                      disabled={isDisabled}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={member.designation}
                      onChange={(e) => handleCrewChange(idx, 'designation', e.target.value)}
                      className="bg-transparent border-0 outline-none w-full font-medium text-gray-700"
                      disabled={isDisabled}
                    >
                      <option>Lineman I</option>
                      <option>Lineman II</option>
                      <option>Assistant Lineman</option>
                      <option>Safety Watcher</option>
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

      <hr className="border-t-2 border-brand-primary/20 my-6" />

      {/* SECTION 5: EMERGENCY PREPAREDNESS & SUPERVISOR SIGN-OFF */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-brand-navy tracking-wider uppercase border-b border-gray-150 pb-2">
          EMERGENCY PREPAREDNESS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFirstAidAvailable(!firstAidAvailable)}
            disabled={isDisabled}
            className={`p-3.5 border rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              firstAidAvailable
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={firstAidAvailable}
                readOnly
                className="accent-emerald-600"
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
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-250 text-gray-700 hover:border-gray-350'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fireExtinguisherAvailable}
                readOnly
                className="accent-emerald-600"
              />
              Fire Extinguisher Available
            </span>
          </button>
        </div>

        <hr className="border-t border-gray-200 my-4" />

        <div className="space-y-4">
          <span className="text-xs font-bold text-brand-navy block uppercase tracking-wider">SUPERVISOR SIGN-OFF</span>
          <div className="max-w-md">
            <SignaturePad
              label="SUPERVISOR SIGNATURE"
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

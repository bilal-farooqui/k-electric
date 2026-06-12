import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
import type { Permit, PermitStatus } from '../../types/ptw';

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
  const [status, setStatus] = useState<PermitStatus>('DRAFT');

  // Form State
  const [faultId, setFaultId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedThrough, setReceivedThrough] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [estimatedDepth, setEstimatedDepth] = useState('');
  const [estimatedArea, setEstimatedArea] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [requestedBy, setRequestedBy] = useState('');
  const [submitterSignature, setSubmitterSignature] = useState('');
  const [approverSignature, setApproverSignature] = useState('');

  useEffect(() => {
    const existing = editId ? permits.find((p) => p.id === editId) : null;
    if (existing) {
      setPermitId(existing.id);
      setStatus(existing.status as PermitStatus);
      const data = existing.formData;
      if (data) {
        setFaultId(data.faultId || '');
        setReceivedDate(data.receivedDate || '');
        setReceivedThrough(data.receivedThrough || '');
        setSiteLocation(data.siteLocation || '');
        setPurpose(data.purpose || '');
        setEstimatedDepth(data.estimatedDepth || '');
        setEstimatedArea(data.estimatedArea || '');
        setStartDate(data.startDate || '');
        setEndDate(data.endDate || '');
        setRequestedBy(data.requestedBy || '');
        setSubmitterSignature(data.submitterSignature || '');
        setApproverSignature(data.approverSignature || '');
      }
    } else {
      setPermitId(`KE-FE-${Math.floor(100000 + Math.random() * 900000)}`);
      setStatus('DRAFT');
      setFaultId('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setReceivedThrough('');
      setSiteLocation('');
      setPurpose('');
      setEstimatedDepth('');
      setEstimatedArea('');
      setStartDate(new Date().toISOString().split('T')[0]);
      const threeDaysLater = new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0];
      setEndDate(threeDaysLater);
      setRequestedBy(currentUser?.name || '');
      setSubmitterSignature('');
      setApproverSignature('');
    }
  }, [permits, editId, currentUser]);

  const handleSaveDraft = () => {
    const newPermit: Permit = {
      id: permitId,
      type: 'fault-excavation',
      title: 'Fault / Excavation Request Form',
      status: 'DRAFT',
      createdAt: new Date().toLocaleString(),
      submittedBy: requestedBy,
      formData: {
        faultId,
        receivedDate,
        receivedThrough,
        siteLocation,
        purpose,
        estimatedDepth,
        estimatedArea,
        startDate,
        endDate,
        requestedBy,
        submitterSignature,
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

    if (!faultId || !receivedDate || !receivedThrough || !siteLocation || !purpose || !estimatedDepth || !estimatedArea || !startDate || !endDate || !requestedBy) {
      alert('Please fill out all request details.');
      return;
    }

    if (!submitterSignature) {
      alert('Requested By signature is required to submit.');
      return;
    }

    const finalStatus = 'PENDING_APPROVAL';

    const newPermit: Permit = {
      id: permitId,
      type: 'fault-excavation',
      title: 'Fault / Excavation Request Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: requestedBy,
      formData: {
        faultId,
        receivedDate,
        receivedThrough,
        siteLocation,
        purpose,
        estimatedDepth,
        estimatedArea,
        startDate,
        endDate,
        requestedBy,
        submitterSignature,
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

  const isAuthorizerDisabled = true;
  const isDisabled = status !== 'DRAFT';

  const existingPermit = permits.find((p) => p.id === permitId);
  const approvedByVal = existingPermit?.approvedBy || (status === 'PENDING_APPROVAL' && currentUser?.role === 'Principal Safety Officer' ? `${currentUser?.name} (${currentUser?.role || 'Safety Officer'})` : 'Awaiting Approval');
  const approvedAtVal = existingPermit?.approvedAt || (status === 'PENDING_APPROVAL' && currentUser?.role === 'Principal Safety Officer' ? new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() : 'Pending Review');

  return (
    <FormWrapper
      title="5. RECEIVING FAULT / EXCAVATION REQUEST FORM"
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
      <div className="bg-amber-50/15 border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm max-w-4xl mx-auto font-serif text-gray-800 leading-loose">
        {/* Letter Subject */}
        <div className="text-center font-bold text-lg mb-8 tracking-wide border-b-2 border-brand-navy pb-3">
          Subject: Receiving Fault / Excavation Request
        </div>

        {/* Salutation */}
        <div className="mb-6 font-semibold">Respected Sir,</div>

        {/* Paragraph 1 */}
        <p className="mb-6 text-justify">
          It is requested that excavation work is required at the fault location against Complaint/Fault ID{" "}
          <input
            type="text"
            required
            value={faultId}
            onChange={(e) => setFaultId(e.target.value)}
            placeholder="Complaint/Fault ID"
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-48 text-brand-navy font-sans"
            disabled={isDisabled}
          />{" "}
          received on{" "}
          <input
            type="date"
            required
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-44 text-brand-navy font-sans"
            disabled={isDisabled}
          />{" "}
          through{" "}
          <input
            type="text"
            required
            value={receivedThrough}
            onChange={(e) => setReceivedThrough(e.target.value)}
            placeholder="channel / source"
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-44 text-brand-navy font-sans"
            disabled={isDisabled}
          />
          . The site is located at{" "}
          <input
            type="text"
            required
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            placeholder="Site location address"
            className="border-b border-gray-400 bg-transparent font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-full max-w-lg text-brand-navy font-sans"
            disabled={isDisabled}
          />
          .
        </p>

        {/* Paragraph 2 */}
        <p className="mb-6 text-justify">
          The excavation is required for the purpose of{" "}
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="purpose of excavation"
            className="border-b border-gray-400 bg-transparent font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-full max-w-md text-brand-navy font-sans"
            disabled={isDisabled}
          />{" "}
          with an estimated depth of{" "}
          <input
            type="text"
            required
            value={estimatedDepth}
            onChange={(e) => setEstimatedDepth(e.target.value)}
            placeholder="depth"
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-32 text-brand-navy font-sans"
            disabled={isDisabled}
          />{" "}
          and area of{" "}
          <input
            type="text"
            required
            value={estimatedArea}
            onChange={(e) => setEstimatedArea(e.target.value)}
            placeholder="area size"
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-36 text-brand-navy font-sans"
            disabled={isDisabled}
          />
          . All necessary utility clearances, including gas, water, telecom, and sewer lines, have been checked before commencement of work.
        </p>

        {/* Paragraph 3 */}
        <p className="mb-10 text-justify">
          Kindly grant approval to proceed with the excavation work from{" "}
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-44 text-brand-navy font-sans"
            disabled={isDisabled}
          />{" "}
          to{" "}
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-b border-gray-400 bg-transparent text-center font-bold px-2 inline-block focus:border-brand-orange focus:outline-none w-44 text-brand-navy font-sans"
            disabled={isDisabled}
          />
          .
        </p>

        <hr className="border-t border-gray-200 my-8" />

        {/* Bottom Signatures Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-sans mt-8 leading-normal">
          {/* Requested By Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 text-sm">Requested By:</span>
              <input
                type="text"
                required
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="border-b border-gray-400 bg-transparent px-2 focus:border-brand-orange focus:outline-none flex-1 font-bold text-brand-navy text-gray-800"
                disabled={isDisabled}
                placeholder="Requester Name"
              />
            </div>
            
            <SignaturePad
              label="Submitter Signature"
              role="Requested By"
              onSign={setSubmitterSignature}
              savedSignature={submitterSignature}
              disabled={isDisabled}
            />
          </div>

          {/* Approved By & Date Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 text-sm">Approved By:</span>
              <span className="border-b border-gray-400 px-2 flex-1 font-bold text-brand-navy block min-h-[24px]">
                {approvedByVal !== 'Awaiting Approval' ? approvedByVal : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
               <span className="font-bold text-gray-700 text-sm">Date:</span>
               <span className="border-b border-gray-400 px-2 flex-1 font-mono font-bold text-brand-navy block min-h-[24px]">
                 {approvedAtVal !== 'Pending Review' ? approvedAtVal : ''}
               </span>
            </div>

            <SignaturePad
              label="Approver Signature"
              role="Approved By"
              onSign={setApproverSignature}
              savedSignature={approverSignature}
              disabled={isAuthorizerDisabled}
            />
          </div>
        </div>
      </div>
    </FormWrapper>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormWrapper } from '../../components/FormWrapper';
import { SignaturePad } from '../../components/SignaturePad';
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
      setStatus(existing.status);
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
      setStatus('draft');
      setFaultId('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setReceivedThrough('Call Center');
      setSiteLocation('');
      setPurpose('Faulty HT cable joint excavation');
      setEstimatedDepth('1.2m');
      setEstimatedArea('6 sq meters');
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
      status: 'draft',
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

    const finalStatus = approverSignature ? 'approved' : 'pending';

    const newPermit: Permit = {
      id: permitId,
      type: 'fault-excavation',
      title: 'Fault / Excavation Request Form',
      status: finalStatus,
      createdAt: new Date().toLocaleString(),
      submittedBy: requestedBy,
      approvedBy: finalStatus === 'approved' ? 'Substation Control Desk' : undefined,
      approvedAt: finalStatus === 'approved' ? new Date().toLocaleString() : undefined,
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
    alert(
      finalStatus === 'approved'
        ? 'Excavation request approved and finalized!'
        : 'Excavation request submitted successfully. Awaiting safety approval.'
    );
    navigate('/');
  };

  const handleApprove = () => {
    if (!approverSignature && status === 'pending') {
      alert('Approved By signature is required to approve.');
      return;
    }
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'approved',
      approvedBy: `${currentUser?.name || 'Safety Officer'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature,
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
    alert('Permit approved successfully!');
    navigate('/admin');
  };

  const handleReject = () => {
    const existing = permits.find((p) => p.id === permitId);
    if (!existing) return;
    const updatedPermit: Permit = {
      ...existing,
      status: 'rejected',
      approvedBy: `${currentUser?.name || 'Safety Officer'} (${currentUser?.role || 'Safety Officer'})`,
      approvedAt: new Date().toLocaleString(),
      formData: {
        ...existing.formData,
        approverSignature,
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

  const isAuthorizerDisabled = status === 'approved' || status === 'rejected' || currentUser?.label !== 'admin';
  const isDisabled = status === 'approved' || status === 'rejected' || (currentUser?.label === 'admin' && status === 'pending');

  const existingPermit = permits.find((p) => p.id === permitId);
  const approvedByVal = existingPermit?.approvedBy || (status === 'pending' && currentUser?.label === 'admin' ? `${currentUser?.name} (${currentUser?.role || 'Safety Officer'})` : 'Awaiting Approval');
  const approvedAtVal = existingPermit?.approvedAt || (status === 'pending' && currentUser?.label === 'admin' ? new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() : 'Pending Review');

  return (
    <FormWrapper
      title="5. RECEIVING FAULT / EXCAVATION REQUEST FORM"
      code={formCode}
      permitId={permitId}
      status={status}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isAdmin={currentUser?.label === 'admin'}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      <div className="bg-amber-50/15 border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm max-w-4xl mx-auto font-serif text-gray-800 leading-loose">
        {/* Letter Subject */}
        <div className="text-center font-bold text-lg mb-8 uppercase tracking-wide border-b-2 border-brand-navy pb-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-sans">
          {/* Requested By Block */}
          <div className="space-y-3 bg-white border border-gray-150 rounded-xl p-4.5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
              <span className="font-bold text-gray-550 text-xs">REQUESTED BY</span>
              <input
                type="text"
                required
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="bg-transparent border-0 border-b border-transparent focus:border-brand-orange text-right outline-none font-bold text-brand-navy w-44"
                disabled={isDisabled}
                placeholder="Enter Submitter Name"
              />
            </div>
            
            <SignaturePad
              label="SUBMITTER SIGNATURE"
              role="Requested By"
              onSign={setSubmitterSignature}
              savedSignature={submitterSignature}
              disabled={isDisabled}
            />
          </div>

          {/* Approved By Block */}
          <div className="space-y-3 bg-white border border-gray-150 rounded-xl p-4.5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
              <span className="font-bold text-gray-550 text-xs">APPROVED BY</span>
              <span className="font-bold text-brand-navy">{approvedByVal}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
               <span className="font-bold text-gray-550 text-xs">DATE</span>
               <span className="font-bold text-brand-navy">{approvedAtVal}</span>
            </div>

            <SignaturePad
              label="APPROVER SIGNATURE"
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

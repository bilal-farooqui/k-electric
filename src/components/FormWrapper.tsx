import React from 'react';
import { Printer, Save, CheckCircle, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { PermitStatus } from '../types/ptw';

interface FormWrapperProps {
  title: string;
  code: string;
  permitId: string;
  status: PermitStatus;
  onSaveDraft?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  children: React.ReactNode;
  isAdmin?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  code,
  permitId,
  status,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
  children,
  isAdmin = false,
  onApprove,
  onReject,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const statusStyles = {
    draft: {
      bg: 'bg-gray-100 border-gray-300 text-gray-800',
      badge: 'bg-gray-200 text-gray-800 border-gray-400',
      label: 'Draft Mode',
      banner: 'This permit is currently in DRAFT status. Make edits and click Submit for authorization.',
      icon: FileText,
    },
    pending: {
      bg: 'bg-amber-50 border-amber-300 text-amber-800',
      badge: 'bg-amber-100 text-amber-800 border-amber-400',
      label: 'Awaiting Sign-off',
      banner: 'WARNING: Pending authorization. Critical operations must NOT start until all safety signatures are approved.',
      icon: AlertTriangle,
    },
    approved: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-400',
      label: 'Authorized & Approved',
      banner: 'PERMIT GRANTED: Operations are authorized to proceed. Follow the safety parameters specified below.',
      icon: ShieldCheck,
    },
    rejected: {
      bg: 'bg-red-50 border-red-300 text-red-800',
      badge: 'bg-red-100 text-red-800 border-red-400',
      label: 'Permit Rejected',
      banner: 'CRITICAL WARNING: This permit request was REJECTED. Under no circumstances should work begin.',
      icon: AlertTriangle,
    },
  };

  const currentStatus = statusStyles[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Alert (Hidden in Print) */}
      <div 
        className={`print:hidden p-4 rounded-xl border flex items-start gap-3 transition-all ${currentStatus.bg}`}
      >
        <StatusIcon className="h-5.5 w-5.5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider">SYSTEM PERMIT STATUS: {currentStatus.label}</div>
          <div className="text-sm mt-1 font-medium">{currentStatus.banner}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 bg-white text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" /> Print/PDF
          </button>
        </div>
      </div>

      {/* Main Technical Document Form */}
      <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden print:border-0 print:shadow-none">
        
        {/* Document Header Panel */}
        <div className="bg-brand-primary p-6 text-white border-b border-gray-800 print:bg-white print:text-black print:p-0 print:border-b-2 print:border-black">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              {/* High-res corporate logo placeholder */}
              <div className="h-10 w-10 bg-brand-accent rounded-lg flex items-center justify-center font-extrabold text-black tracking-tighter text-lg shrink-0 print:border print:border-black">
                KE
              </div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight uppercase print:text-lg">
                  {title}
                </h1>
                <div className="text-xs text-gray-400 font-mono mt-0.5 print:text-black">
                  K-ELECTRIC ENTERPRISE OPERATIONS PORTAL
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-4 text-xs font-mono md:text-right print:text-black">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 print:border-0 print:p-0 print:bg-transparent">
                <span className="text-gray-400 block text-[9px] print:text-black print:font-bold">PERMIT ID:</span>
                <span className="font-bold text-white print:text-black">{permitId}</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 print:border-0 print:p-0 print:bg-transparent">
                <span className="text-gray-400 block text-[9px] print:text-black print:font-bold">DOC REF / REV:</span>
                <span className="font-bold text-white print:text-black">{code} / Rev. 4</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 print:border-0 print:p-0 print:bg-transparent">
                <span className="text-gray-400 block text-[9px] print:text-black print:font-bold">STATUS:</span>
                <span className="font-bold text-brand-accent print:text-black uppercase">{status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Inner Content */}
        <div className="p-6 md:p-8 space-y-8 bg-linear-to-b from-white to-gray-50/50 print:p-0 print:bg-white print:space-y-6">
          {children}
        </div>

        {/* Document Footer Controls (Hidden in Print) */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 print:hidden">
          <div className="text-xs text-gray-400 italic">
            This is an electronic safety record. Tampering is a strictly punishable corporate offense.
          </div>
          
          <div className="flex gap-2.5 sm:self-end">
            {onSaveDraft && status === 'draft' && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="flex items-center justify-center gap-1.5 bg-white text-gray-700 border border-gray-300 px-4.5 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 shadow-xs transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>
            )}
            
            {isAdmin && status === 'pending' && onApprove && onReject ? (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onApprove}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-750 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" /> Approve Permit
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="flex items-center justify-center gap-1.5 bg-red-650 hover:bg-red-750 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" /> Reject Permit
                </button>
              </div>
            ) : (
              status !== 'approved' && status !== 'rejected' && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 bg-brand-navy hover:bg-brand-primary text-brand-accent border border-brand-accent/20 px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 text-brand-accent" />
                  {isSubmitting ? 'Validating...' : 'Submit & Authorize'}
                </button>
              )
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

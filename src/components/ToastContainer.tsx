import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const messageLower = message.toLowerCase();
    
    let type: 'success' | 'error' | 'warning' | 'info' = 'info';
    if (
      messageLower.includes('success') || 
      messageLower.includes('approved') || 
      messageLower.includes('synchronized') || 
      messageLower.includes('saved') ||
      messageLower.includes('completed')
    ) {
      type = 'success';
    } else if (
      messageLower.includes('fail') || 
      messageLower.includes('error') || 
      messageLower.includes('required') || 
      messageLower.includes('missing') || 
      messageLower.includes('must') || 
      messageLower.includes('invalid') ||
      messageLower.includes('cannot')
    ) {
      type = 'error';
    } else if (
      messageLower.includes('reject') || 
      messageLower.includes('warning') || 
      messageLower.includes('caution')
    ) {
      type = 'warning';
    }

    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Hook into global window.alert
  useEffect(() => {
    const nativeAlert = window.alert;
    
    window.alert = (message: any) => {
      addToast(String(message));
    };

    // Restore on unmount
    return () => {
      window.alert = nativeAlert;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-9999 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map((toast) => {
        // Theme styling classes
        const config = {
          success: {
            bg: 'bg-emerald-950/85 border-emerald-500/35',
            text: 'text-emerald-200',
            bar: 'bg-emerald-500',
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
          },
          error: {
            bg: 'bg-red-950/85 border-red-500/35',
            text: 'text-red-200',
            bar: 'bg-red-500',
            icon: <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />,
          },
          warning: {
            bg: 'bg-amber-950/85 border-amber-500/35',
            text: 'text-amber-200',
            bar: 'bg-amber-500',
            icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
          },
          info: {
            bg: 'bg-slate-900/90 border-slate-700/40',
            text: 'text-slate-200',
            bar: 'bg-blue-500',
            icon: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-in transition-all duration-300 hover:scale-[1.02] ${config.bg}`}
          >
            {config.icon}
            
            <div className="flex-1 text-xs font-semibold leading-relaxed pr-2 whitespace-pre-line select-none">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Auto dismiss progress bar */}
            <div className="absolute bottom-0 left-0 h-0.75 w-full bg-white/5">
              <div className={`h-full animate-progress ${config.bar}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ToastContainer;

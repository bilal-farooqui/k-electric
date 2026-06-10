import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, Edit3, Trash2, Award } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  role: string;
  onSign: (signatureData: string) => void;
  savedSignature?: string;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  role,
  onSign,
  savedSignature,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'stamp'>('draw');
  const [stampName, setStampName] = useState('');
  const [stampBadge, setStampBadge] = useState('');
  const [stampColor, setStampColor] = useState<'green' | 'blue' | 'orange'>('orange');
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (savedSignature && activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = savedSignature;
        }
      }
    }
  }, [savedSignature, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || savedSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0B132B';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || savedSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Auto-save the drawn signature to state
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSign(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onSign('');
      }
    }
  };

  const applyStamp = () => {
    if (!stampName.trim() || !stampBadge.trim()) return;
    const timestamp = new Date().toLocaleString();
    const stampText = `STAMP::${stampColor.toUpperCase()}::${stampName} (${stampBadge}) - Authorized as ${role} at ${timestamp}`;
    onSign(stampText);
  };

  const renderStampPreview = (text: string) => {
    const parts = text.split('::');
    if (parts.length < 3) return null;
    const color = parts[1];
    const details = parts[2];

    const borderColors = {
      GREEN: 'border-emerald-600 bg-emerald-50 text-emerald-800',
      BLUE: 'border-blue-600 bg-blue-50 text-blue-800',
      ORANGE: 'border-orange-600 bg-orange-50 text-orange-800',
    };

    const iconColors = {
      GREEN: 'text-emerald-600',
      BLUE: 'text-blue-600',
      ORANGE: 'text-orange-600',
    };

    const selectClass = borderColors[color as keyof typeof borderColors] || borderColors.ORANGE;
    const iconClass = iconColors[color as keyof typeof iconColors] || iconColors.ORANGE;

    return (
      <div className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center font-display ${selectClass}`}>
        <ShieldCheck className={`h-8 w-8 mb-1.5 animate-pulse ${iconClass}`} />
        <div className="text-xs font-bold tracking-wider uppercase mb-1">DIGITAL APPROVAL STAMP</div>
        <div className="text-sm font-extrabold">{details.split(' - ')[0]}</div>
        <div className="text-[10px] opacity-75 mt-1">{details.split(' - ')[1] || 'Verified'}</div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{label}</label>
          <span className="text-sm font-semibold text-brand-navy block mt-0.5">{role} Authorization</span>
        </div>
        
        {!savedSignature && !disabled && (
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                activeTab === 'draw' ? 'bg-white text-brand-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> Draw
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stamp')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                activeTab === 'stamp' ? 'bg-white text-brand-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Award className="h-3.5 w-3.5" /> E-Stamp
            </button>
          </div>
        )}
      </div>

      {savedSignature ? (
        <div className="mt-2">
          {savedSignature.startsWith('STAMP::') ? (
            renderStampPreview(savedSignature)
          ) : (
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-2 flex flex-col items-center">
              <img src={savedSignature} alt="Signature" className="max-h-24 object-contain" />
              <div className="text-[10px] text-gray-400 mt-1 font-mono">Digital Signature Hash Verified</div>
            </div>
          )}
        </div>
      ) : disabled ? (
        <div className="h-28 border border-gray-100 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-400 italic">
          Awaiting Supervisor review
        </div>
      ) : (
        <div className="mt-2">
          {activeTab === 'draw' ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={360}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-30 bg-gray-50 border border-gray-200 rounded-lg cursor-crosshair touch-none"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute bottom-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors shadow-sm"
                title="Clear Drawing"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">OFFICER NAME</label>
                  <input
                    type="text"
                    value={stampName}
                    onChange={(e) => setStampName(e.target.value)}
                    placeholder="e.g. Maheen Mahad"
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">BADGE ID</label>
                  <input
                    type="text"
                    value={stampBadge}
                    onChange={(e) => setStampBadge(e.target.value)}
                    placeholder="e.g. KE-7492"
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  {(['orange', 'green', 'blue'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setStampColor(color)}
                      className={`h-4.5 w-4.5 rounded-full border transition-all ${
                        color === 'orange' ? 'bg-orange-500' : color === 'green' ? 'bg-emerald-500' : 'bg-blue-600'
                      } ${stampColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-85'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={applyStamp}
                  disabled={!stampName.trim() || !stampBadge.trim()}
                  className="bg-brand-navy text-white text-[11px] font-bold px-3 py-1.5 rounded-md hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Apply Stamp
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

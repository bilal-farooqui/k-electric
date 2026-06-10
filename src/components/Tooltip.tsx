import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', children }) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children || (
        <Info className="h-4.5 w-4.5 text-blue-500 cursor-pointer hover:text-blue-600 transition-colors" />
      )}
      {visible && (
        <div 
          className={`absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs font-normal rounded-lg shadow-xl border border-gray-700/50 backdrop-blur-md transition-all duration-200 ${positionClasses[position]}`}
        >
          <div className="relative">
            {content}
            <span 
              className={`absolute border-4 border-transparent ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900' :
                'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
              }`} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

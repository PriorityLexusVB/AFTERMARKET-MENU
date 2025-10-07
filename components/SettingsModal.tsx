import React, { useState, useEffect } from 'react';

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: CustomerInfo) => void;
  currentInfo: CustomerInfo;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentInfo }) => {
  const [info, setInfo] = useState<CustomerInfo>(currentInfo);

  useEffect(() => {
    setInfo(currentInfo);
  }, [currentInfo]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(info);
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-600 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 id="settings-modal-title" className="text-2xl font-bold font-teko text-white tracking-wider">Customer & Vehicle Information</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
            <input type="text" name="name" id="name" value={info.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">Vehicle Year</label>
              <input type="text" name="year" id="year" value={info.year} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">Make</label>
              <input type="text" name="make" id="make" value={info.make} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
              <input type="text" name="model" id="model" value={info.model} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-900/50 border-t border-gray-700 text-right rounded-b-xl">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors transform active:scale-95"
            >
              Save & Close
            </button>
        </div>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

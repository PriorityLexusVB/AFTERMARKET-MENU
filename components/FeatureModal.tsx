import React, { useEffect } from 'react';
import type { ProductFeature, AlaCarteOption } from '../types';

interface FeatureModalProps {
  feature: ProductFeature | AlaCarteOption;
  onClose: () => void;
}

const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

const LightbulbIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path d="M10 2a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0V2zM3.81 4.31a.75.75 0 00-1.06-1.06L1.5 4.5a.75.75 0 001.06 1.06l1.25-1.25zM16.19 4.31a.75.75 0 001.06-1.06l-1.25-1.25a.75.75 0 00-1.06 1.06l1.25 1.25zM2 10a.75.75 0 000 1.5h1.25a.75.75 0 000-1.5H2zM16.75 10a.75.75 0 000 1.5h1.25a.75.75 0 000-1.5h-1.25zM4.81 15.19a.75.75 0 00-1.06 1.06l1.25 1.25a.75.75 0 001.06-1.06l-1.25-1.25zM15.19 15.19a.75.75 0 001.06 1.06l1.25 1.25a.75.75 0 00-1.06-1.06l-1.25-1.25zM10 16a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0V16z" />
        <path fillRule="evenodd" d="M9 4.75A4.25 4.25 0 004.75 9C4.75 11.347 6.653 13.25 9 13.25s4.25-1.903 4.25-4.25A4.25 4.25 0 009 4.75zM7.25 9a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0z" clipRule="evenodd" />
    </svg>
);


export const FeatureModal: React.FC<FeatureModalProps> = ({ feature, onClose }) => {
  useEffect(() => {
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
  }, [onClose]);
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-600 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h2 id="feature-modal-title" className="text-3xl sm:text-4xl font-bold font-teko text-white tracking-wider">{feature.name}</h2>
            <p className="text-gray-400 mt-1">{feature.description}</p>
            {'warranty' in feature && feature.warranty && (
                <p className="mt-2 text-sm font-bold bg-yellow-400/10 text-yellow-300 px-2 py-1 rounded-md inline-block">{feature.warranty}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close feature details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
          {feature.points && feature.points.length > 0 && (
            <div>
              <h3 className="text-xl font-bold font-teko tracking-wider text-blue-400 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {feature.points.map((point, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckIcon className="text-green-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {feature.useCases && feature.useCases.length > 0 && (
            <div>
              <h3 className="text-xl font-bold font-teko tracking-wider text-yellow-400 mb-3">Real-World Scenarios</h3>
              <ul className="space-y-2">
                {feature.useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <LightbulbIcon className="text-yellow-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
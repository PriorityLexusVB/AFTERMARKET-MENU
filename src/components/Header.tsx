import React from 'react';
import { User } from 'firebase/auth';

const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.905c-.008.379.137.752.43.992l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.905c.008-.379-.137-.752-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

interface HeaderProps {
    user: User | null;
    onOpenSettings: () => void;
    onLogout: () => void;
    onToggleAdminView: () => void;
    isAdminView: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user: _user, onOpenSettings, onLogout, onToggleAdminView, isAdminView }) => {
  return (
    <header className="bg-black bg-opacity-30 backdrop-blur-sm py-4 border-b border-gray-700 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-widest font-teko text-white">PRIORITY <span className="text-gray-400">LEXUS</span></h1>
          <p className="text-sm text-gray-400 tracking-widest">VIRGINIA BEACH</p>
        </div>
        <div className="flex items-center gap-4">
            <button 
              onClick={onToggleAdminView} 
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors bg-gray-700/50 px-3 py-1.5 rounded-md"
            >
              {isAdminView ? 'View Menu' : 'Admin Panel'}
            </button>
             <button 
              onClick={onLogout} 
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          <div className="h-6 w-px bg-gray-600"></div>
          <p className="text-lg text-gray-300 font-light font-teko tracking-widest hidden md:block">PRIORITIES FOR LIFE</p>
           <button 
            onClick={onOpenSettings} 
            className="text-gray-400 hover:text-white hover:rotate-90 transition-all duration-300"
            aria-label="Open Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
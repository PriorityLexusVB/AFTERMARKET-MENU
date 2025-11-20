import React from 'react';

export type AdminTab = 'dashboard' | 'features' | 'packages' | 'alacarte' | 'settings';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'Overview & Analytics',
  },
  {
    id: 'features',
    label: 'Features',
    icon: '🔧',
    description: 'Manage Product Features',
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: '📦',
    description: 'Create & Edit Packages',
  },
  {
    id: 'alacarte',
    label: 'À La Carte',
    icon: '🛒',
    description: 'Standalone Options',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Categories & Preferences',
  },
];

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-700 mb-6">
      <nav className="flex flex-wrap gap-2 -mb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative px-4 py-3 font-teko text-lg tracking-wider transition-all
                ${
                  isActive
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200 hover:border-b-2 hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tab.description}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

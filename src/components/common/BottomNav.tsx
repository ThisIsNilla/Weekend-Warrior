import React from 'react';
import { Compass, ListFilter, MapPinned } from 'lucide-react';

export type AppTab = 'triage' | 'nearby' | 'manage' | 'spots';

export interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  totalSpotsCount?: number;
}

const NAV_ITEMS: ReadonlyArray<{
  id: Exclude<AppTab, 'spots'>;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'triage', label: 'Triage', Icon: Compass },
  { id: 'nearby', label: 'Nearby Feed', Icon: MapPinned },
  { id: 'manage', label: 'Manage Spots', Icon: ListFilter },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  totalSpotsCount,
}) => {
  return (
    <nav
      aria-label="Primary bottom navigation"
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-30 pb-safe pointer-events-none flex justify-center"
    >
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur border-t border-slate-800 px-3 py-2 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive =
              activeTab === id || (id === 'manage' && activeTab === 'spots');
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`nav-tab-${id}`}
                onClick={() => onSelectTab(id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-400/15 text-teal-400 border border-teal-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="w-4 h-4 mb-0.5" />
                  {id === 'manage' && typeof totalSpotsCount === 'number' && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                      {totalSpotsCount}
                    </span>
                  )}
                </div>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

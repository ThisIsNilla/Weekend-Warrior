import React from 'react';
import type { TriageCountOption } from '../../types';
import { TRIAGE_MODE_TABS } from '../../utils/triageFormatters';

export interface TriageModeSelectorProps {
  selectedCount: TriageCountOption;
  onSelectCount: (count: TriageCountOption) => void;
}

export const TriageModeSelector: React.FC<TriageModeSelectorProps> = ({
  selectedCount,
  onSelectCount,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Outing option count selector"
      data-testid="triage-mode-selector"
      className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-800/90 border border-slate-700"
    >
      {TRIAGE_MODE_TABS.map((tab) => {
        const isActive = selectedCount === tab.value;
        return (
          <button
            key={String(tab.value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={`mode-tab-${tab.value}`}
            onClick={() => onSelectCount(tab.value)}
            className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-center transition-all ${
              isActive
                ? 'bg-teal-400 text-slate-900 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium'
            }`}
          >
            <span className="text-xs leading-tight">{tab.label}</span>
            <span
              className={`text-[10px] mt-0.5 leading-none ${
                isActive ? 'text-slate-800 font-semibold' : 'text-slate-400'
              }`}
            >
              {tab.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};

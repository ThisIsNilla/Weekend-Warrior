import React from 'react';
import { Dices, Sparkles } from 'lucide-react';
import type { TriageCountOption } from '../../types';

export interface TriageButtonProps {
  hasTriaged?: boolean;
  countOption?: TriageCountOption;
  disabled?: boolean;
  onClick: () => void;
}

export const TriageButton: React.FC<TriageButtonProps> = ({
  hasTriaged = false,
  countOption = 5,
  disabled = false,
  onClick,
}) => {
  const buttonLabel = hasTriaged ? 'Reroll Options' : 'Triage: Pick Options';
  const countBadge =
    countOption === 'all' ? 'All Nearby' : `Top ${countOption}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="triage-action-button"
      className="w-full py-3.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-[0.99] text-slate-900 font-bold text-sm shadow-lg shadow-teal-400/15 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
    >
      {hasTriaged ? (
        <Dices className="w-5 h-5 shrink-0" />
      ) : (
        <Sparkles className="w-5 h-5 shrink-0" />
      )}
      <span>{buttonLabel}</span>
      <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-slate-900/15 text-slate-900">
        {countBadge}
      </span>
    </button>
  );
};

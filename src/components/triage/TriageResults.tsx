import React from 'react';
import { Dices, RotateCcw, SearchX } from 'lucide-react';
import type { TriageCandidate, TriageCountOption } from '../../types';
import { TriageCard } from './TriageCard';

export interface TriageResultsProps {
  candidates: TriageCandidate[];
  totalCandidates: number;
  countOption: TriageCountOption;
  onReroll?: () => void;
  onResetFilters?: () => void;
  onOpenMaps?: (candidate: TriageCandidate) => void;
}

export const TriageResults: React.FC<TriageResultsProps> = ({
  candidates,
  totalCandidates,
  countOption,
  onReroll,
  onResetFilters,
  onOpenMaps,
}) => {
  if (candidates.length === 0) {
    return (
      <div
        data-testid="triage-empty-state"
        className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-700/60 text-amber-400 flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            No Matching Outings Found
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Try expanding your distance radius, enabling outdoor spots during rain, or clearing active kid and cost filters.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            data-testid="empty-reset-filters-button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  const showShuffleButton =
    Boolean(onReroll) && countOption !== 'all' && totalCandidates > candidates.length;

  return (
    <section
      aria-label="Triaged outing candidates"
      data-testid="triage-results-list"
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-400">
          Showing{' '}
          <span className="text-white font-bold">{candidates.length}</span> of{' '}
          <span className="text-teal-400 font-semibold">{totalCandidates}</span>{' '}
          matching spots
        </p>

        {showShuffleButton && onReroll && (
          <button
            type="button"
            onClick={onReroll}
            data-testid="results-shuffle-button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {candidates.map((candidate, index) => (
          <TriageCard
            key={candidate.spot.id}
            candidate={candidate}
            rank={index + 1}
            onOpenMaps={onOpenMaps}
          />
        ))}
      </div>
    </section>
  );
};

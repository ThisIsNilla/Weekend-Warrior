import React from 'react';
import {
  Compass,
  Footprints,
  Globe,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SearchX,
} from 'lucide-react';
import type {
  SpotCategory,
  TriageCandidate,
  TriageFilter,
} from '../../types';
import { SPOT_CATEGORIES } from '../../types';
import { groupCandidatesByProximityBand } from '../../utils/spotManagementHelpers';
import { formatCategoryLabel } from '../../utils/triageFormatters';
import { TriageCard } from '../triage/TriageCard';
import { QuickFilterChips } from '../triage/TriageFilterModal';

export interface NearbyFeedViewProps {
  candidates: TriageCandidate[];
  totalCandidates?: number;
  filter: TriageFilter;
  onChangeFilter: (updated: TriageFilter) => void;
  onResetFilters: () => void;
  onOpenFilterModal?: () => void;
  onOpenRequestCoverage: () => void;
  onOpenAddSpot?: () => void;
  onOpenMaps?: (candidate: TriageCandidate) => void;
}

export const NearbyFeedView: React.FC<NearbyFeedViewProps> = ({
  candidates,
  totalCandidates,
  filter,
  onChangeFilter,
  onResetFilters,
  onOpenFilterModal,
  onOpenRequestCoverage,
  onOpenAddSpot,
  onOpenMaps,
}) => {
  const sections = groupCandidatesByProximityBand(candidates, filter);
  const matchedCount = sections.reduce(
    (sum, section) => sum + section.candidates.length,
    0,
  );
  const selectedCategories = filter.categories ?? [];
  const effectiveTotal = totalCandidates ?? candidates.length;

  const handleSearchChange = (query: string) => {
    onChangeFilter({
      ...filter,
      searchQuery: query,
    });
  };

  const handleSelectAllCategories = () => {
    onChangeFilter({
      ...filter,
      categories: undefined,
    });
  };

  const handleToggleCategory = (category: SpotCategory) => {
    const exists = selectedCategories.includes(category);
    const next = exists
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];

    onChangeFilter({
      ...filter,
      categories: next.length > 0 ? next : undefined,
    });
  };

  return (
    <div className="space-y-4" data-testid="nearby-feed-view">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          aria-label="Search nearby spots"
          data-testid="nearby-search-input"
          value={filter.searchQuery ?? ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search nearby parks, museums, handles, or towns..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
        />
      </div>

      {/* Quick Kid / Free Filter Toggles */}
      <QuickFilterChips
        filter={filter}
        onChangeFilter={onChangeFilter}
        onOpenModal={onOpenFilterModal ?? (() => {})}
      />

      {/* Horizontal Category Filter Pills */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        data-testid="nearby-category-pills"
      >
        <button
          type="button"
          data-testid="category-pill-all"
          aria-pressed={selectedCategories.length === 0}
          onClick={handleSelectAllCategories}
          className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 transition-colors ${
            selectedCategories.length === 0
              ? 'bg-teal-400 text-slate-900 border-teal-400 font-bold'
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          All Categories
        </button>

        {SPOT_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              data-testid={`category-pill-${category}`}
              aria-pressed={isSelected}
              onClick={() => handleToggleCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 transition-colors ${
                isSelected
                  ? 'bg-teal-400/20 text-teal-300 border-teal-400'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {formatCategoryLabel(category)}
            </button>
          );
        })}
      </div>

      {/* Summary & Quick Add Action Row */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-400">
          Sorted by distance:{' '}
          <span className="text-white font-bold">{matchedCount}</span> of{' '}
          <span className="text-teal-400 font-semibold">{effectiveTotal}</span>{' '}
          spots
        </p>

        {onOpenAddSpot && (
          <button
            type="button"
            onClick={onOpenAddSpot}
            data-testid="nearby-add-spot-button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Instagram Find</span>
          </button>
        )}
      </div>

      {/* Grouped Proximity Band Sections or Empty State */}
      {sections.length === 0 ? (
        <div
          data-testid="nearby-empty-state"
          className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-700/60 text-amber-400 flex items-center justify-center mx-auto">
            <SearchX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              No Nearby Spots Match Your Filters
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Try clearing your search or category pills, or request coverage
              for your city below.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={onResetFilters}
              data-testid="nearby-reset-filters-button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              type="button"
              onClick={onOpenRequestCoverage}
              data-testid="empty-request-coverage-button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-semibold transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Request My City</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5" data-testid="nearby-proximity-groups">
          {sections.map((section) => (
            <section
              key={section.band}
              data-testid={`proximity-group-${section.band}`}
              aria-label={`${section.title} (${section.rangeLabel})`}
              className="space-y-2.5"
            >
              <div className="bg-slate-800/90 border border-slate-700/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {section.band === 'walking' ? (
                    <Footprints className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : section.band === 'day_trip' ? (
                    <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white">
                        {section.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-teal-400">
                        ({section.rangeLabel})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  data-testid={`proximity-count-${section.band}`}
                  className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-200 text-xs font-bold border border-slate-700 shrink-0"
                >
                  {section.candidates.length}
                </span>
              </div>

              <div className="space-y-3">
                {section.candidates.map((candidate) => (
                  <TriageCard
                    key={candidate.spot.id}
                    candidate={candidate}
                    onOpenMaps={onOpenMaps}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Community City Coverage Prompt Card */}
      <div
        data-testid="request-coverage-banner"
        className="bg-gradient-to-br from-slate-800 to-slate-800/70 border border-teal-400/30 rounded-2xl p-4 space-y-2.5 shadow-md"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-400/15 border border-teal-400/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
            <Globe className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Outside the Capital Region?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Request social event coverage for your US city or town and share
              your favorite local family Instagram creators (@handles).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRequestCoverage}
          data-testid="open-request-coverage-button"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors shadow-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Request Coverage for My City</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Baby,
  DollarSign,
  Flame,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Smile,
  X,
} from 'lucide-react';
import type { EnergyLevel, TriageFilter } from '../../types';
import {
  DISTANCE_RADIUS_OPTIONS,
  ENERGY_FILTER_OPTIONS,
  countActiveFilters,
  isFreeOnlyActive,
} from '../../utils/triageFormatters';

export interface TriageFilterModalProps {
  isOpen: boolean;
  filter: TriageFilter;
  onChangeFilter: (updated: TriageFilter) => void;
  onResetFilters: () => void;
  onClose: () => void;
}

export interface QuickFilterChipsProps {
  filter: TriageFilter;
  onChangeFilter: (updated: TriageFilter) => void;
  onOpenModal: () => void;
}

/**
 * Quick filter bar displayed directly on the main Triage screen for one-tap parent filtering.
 */
export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  filter,
  onChangeFilter,
  onOpenModal,
}) => {
  const freeOnly = isFreeOnlyActive(filter);
  const activeCount = countActiveFilters(filter);

  const toggleToddler = () => {
    onChangeFilter({
      ...filter,
      requireToddlerFriendly: !filter.requireToddlerFriendly,
    });
  };

  const toggleYoungKids = () => {
    onChangeFilter({
      ...filter,
      requireYoungKidFriendly: !filter.requireYoungKidFriendly,
    });
  };

  const toggleFreeOnly = () => {
    onChangeFilter({
      ...filter,
      costLevels: freeOnly ? undefined : ['free'],
    });
  };

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
      data-testid="quick-filter-chips"
    >
      <button
        type="button"
        onClick={onOpenModal}
        data-testid="open-filter-modal-button"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
          activeCount > 0
            ? 'bg-teal-400/15 text-teal-400 border-teal-400/40'
            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-teal-400 text-slate-900 text-[10px] font-extrabold">
            {activeCount}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-pressed={Boolean(filter.requireToddlerFriendly)}
        data-testid="quick-chip-toddler"
        onClick={toggleToddler}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
          filter.requireToddlerFriendly
            ? 'bg-amber-400 text-slate-900 border-amber-400 font-bold'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
        }`}
      >
        <Baby className="w-3.5 h-3.5" />
        <span>Toddler (0-3)</span>
      </button>

      <button
        type="button"
        aria-pressed={Boolean(filter.requireYoungKidFriendly)}
        data-testid="quick-chip-young-kids"
        onClick={toggleYoungKids}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
          filter.requireYoungKidFriendly
            ? 'bg-teal-400 text-slate-900 border-teal-400 font-bold'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
        }`}
      >
        <Smile className="w-3.5 h-3.5" />
        <span>Young Kids (4-7)</span>
      </button>

      <button
        type="button"
        aria-pressed={freeOnly}
        data-testid="quick-chip-free"
        onClick={toggleFreeOnly}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
          freeOnly
            ? 'bg-emerald-400 text-slate-900 border-emerald-400 font-bold'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
        }`}
      >
        <DollarSign className="w-3.5 h-3.5" />
        <span>Free Only</span>
      </button>
    </div>
  );
};

export const TriageFilterModal: React.FC<TriageFilterModalProps> = ({
  isOpen,
  filter,
  onChangeFilter,
  onResetFilters,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const freeOnly = isFreeOnlyActive(filter);
  const selectedEnergies = filter.energyLevels ?? [];

  const handleToggleToddler = () => {
    onChangeFilter({
      ...filter,
      requireToddlerFriendly: !filter.requireToddlerFriendly,
    });
  };

  const handleToggleYoungKids = () => {
    onChangeFilter({
      ...filter,
      requireYoungKidFriendly: !filter.requireYoungKidFriendly,
    });
  };

  const handleToggleFreeOnly = () => {
    onChangeFilter({
      ...filter,
      costLevels: freeOnly ? undefined : ['free'],
    });
  };

  const handleSelectDistance = (miles: number | undefined) => {
    onChangeFilter({
      ...filter,
      maxDistanceMiles: miles,
    });
  };

  const handleToggleEnergy = (level: EnergyLevel) => {
    const exists = selectedEnergies.includes(level);
    const next = exists
      ? selectedEnergies.filter((item) => item !== level)
      : [...selectedEnergies, level];
    onChangeFilter({
      ...filter,
      energyLevels: next.length > 0 ? next : undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Outing Triage Filters"
      data-testid="triage-filter-modal"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-slate-800 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              Triage Filters
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter modal"
            data-testid="close-filter-modal-button"
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Strict Kid Age Suitability Toggles */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kid Age Suitability (Strict Filter)
          </p>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(filter.requireToddlerFriendly)}
            data-testid="modal-toggle-toddler"
            onClick={handleToggleToddler}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
              filter.requireToddlerFriendly
                ? 'bg-amber-400/15 border-amber-400 text-white'
                : 'bg-slate-900/70 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Baby className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Toddler Friendly (Ages 0 to 3)</p>
                <p className="text-[11px] text-slate-400">
                  Strictly exclude spots not suited for toddlers
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                filter.requireToddlerFriendly
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {filter.requireToddlerFriendly ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(filter.requireYoungKidFriendly)}
            data-testid="modal-toggle-young-kids"
            onClick={handleToggleYoungKids}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
              filter.requireYoungKidFriendly
                ? 'bg-teal-400/15 border-teal-400 text-white'
                : 'bg-slate-900/70 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smile className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Young Kids (Ages 4 to 7)</p>
                <p className="text-[11px] text-slate-400">
                  Strictly exclude spots not suited for young kids
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                filter.requireYoungKidFriendly
                  ? 'bg-teal-400 text-slate-900'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {filter.requireYoungKidFriendly ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Budget / Free Outings Only Toggle */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Budget Preference
          </p>

          <button
            type="button"
            role="switch"
            aria-checked={freeOnly}
            data-testid="modal-toggle-free-only"
            onClick={handleToggleFreeOnly}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
              freeOnly
                ? 'bg-emerald-400/15 border-emerald-400 text-white'
                : 'bg-slate-900/70 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Free Outings Only</p>
                <p className="text-[11px] text-slate-400">
                  Hide paid admission venues
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                freeOnly
                  ? 'bg-emerald-400 text-slate-900'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {freeOnly ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Distance Radius Slider & Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="distance-radius-slider"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Max Distance Radius</span>
            </label>
            <span className="text-xs font-semibold text-teal-400">
              {filter.maxDistanceMiles ? `Up to ${filter.maxDistanceMiles} mi` : 'Any Distance'}
            </span>
          </div>

          <input
            id="distance-radius-slider"
            type="range"
            min={5}
            max={50}
            step={5}
            aria-label="Max Distance Radius Slider"
            data-testid="distance-radius-slider"
            value={filter.maxDistanceMiles ?? 50}
            onChange={(e) => {
              const numericVal = Number(e.target.value);
              handleSelectDistance(numericVal >= 50 ? undefined : numericVal);
            }}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />

          <div className="grid grid-cols-5 gap-1.5">
            {DISTANCE_RADIUS_OPTIONS.map((option) => {
              const selected = filter.maxDistanceMiles === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  data-testid={`distance-option-${option.value ?? 'any'}`}
                  onClick={() => handleSelectDistance(option.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-colors ${
                    selected
                      ? 'bg-teal-400 text-slate-900 border-teal-400 font-bold'
                      : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Level Filter */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Energy Level</span>
          </p>

          <div className="grid grid-cols-3 gap-2">
            {ENERGY_FILTER_OPTIONS.map((option) => {
              const active = selectedEnergies.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  data-testid={`energy-option-${option.value}`}
                  onClick={() => handleToggleEnergy(option.value)}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    active
                      ? 'bg-teal-400/15 border-teal-400 text-white'
                      : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{option.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {option.sublabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-700 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onResetFilters}
            data-testid="modal-reset-filters-button"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            data-testid="modal-apply-button"
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

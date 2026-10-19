import React, { useState } from 'react';
import {
  Camera,
  Globe,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
} from 'lucide-react';
import type { LocationCoords, Spot, SpotCategory } from '../../types';
import { SPOT_CATEGORIES } from '../../types';
import {
  filterManagedSpots,
  isCustomSpot,
} from '../../utils/spotManagementHelpers';
import { formatCategoryLabel } from '../../utils/triageFormatters';
import { SpotCard } from './SpotCard';

export interface SpotListProps {
  spots: Spot[];
  userLocation?: LocationCoords;
  onAddSpot: () => void;
  onEditSpot: (spot: Spot) => void;
  onDeleteSpot: (id: string) => void;
  onResetSpots: () => void;
  onOpenRequestCoverage?: () => void;
  initialSearchQuery?: string;
  initialCategory?: SpotCategory | 'all';
  initialInstagramOnly?: boolean;
  initialCustomOnly?: boolean;
}

export const SpotList: React.FC<SpotListProps> = ({
  spots,
  userLocation,
  onAddSpot,
  onEditSpot,
  onDeleteSpot,
  onResetSpots,
  onOpenRequestCoverage,
  initialSearchQuery = '',
  initialCategory = 'all',
  initialInstagramOnly = false,
  initialCustomOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<
    SpotCategory | 'all'
  >(initialCategory);
  const [instagramOnly, setInstagramOnly] =
    useState<boolean>(initialInstagramOnly);
  const [customOnly, setCustomOnly] = useState<boolean>(initialCustomOnly);

  const filteredSpots = filterManagedSpots(spots, {
    searchQuery,
    category: selectedCategory,
    instagramOnly,
    customOnly,
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setInstagramOnly(false);
    setCustomOnly(false);
  };

  return (
    <div className="space-y-4" data-testid="manage-spots-view">
      {/* Top Summary & Reset Header Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white">
              Saved Capital Region Spots
            </h2>
            <p className="text-xs text-slate-400">
              {spots.length} family outing locations in local storage
            </p>
          </div>

          <button
            type="button"
            onClick={onResetSpots}
            data-testid="reset-seed-spots-button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-400 text-xs font-semibold transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Seeds</span>
          </button>
        </div>

        {/* Primary CTA: + Add Spot / Instagram Find */}
        <button
          type="button"
          onClick={onAddSpot}
          data-testid="add-spot-cta-button"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-[0.99] text-slate-900 text-xs font-extrabold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Spot / Instagram Find</span>
        </button>
      </div>

      {/* Search & Category Filter Row */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search saved spots"
              data-testid="spot-list-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by spot name, city, or @handle..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>

          <select
            aria-label="Filter spots by category"
            data-testid="spot-list-category-select"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as SpotCategory | 'all')
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
          >
            <option value="all">All Categories</option>
            {SPOT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Toggles: Instagram Finds Only & Custom Spots Only */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            aria-pressed={instagramOnly}
            data-testid="filter-instagram-only"
            onClick={() => setInstagramOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              instagramOnly
                ? 'bg-pink-500/20 text-pink-300 border-pink-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span>Instagram Finds Only</span>
          </button>

          <button
            type="button"
            aria-pressed={customOnly}
            data-testid="filter-custom-only"
            onClick={() => setCustomOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              customOnly
                ? 'bg-amber-400/20 text-amber-300 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom Spots Only</span>
          </button>

          {onOpenRequestCoverage && (
            <button
              type="button"
              onClick={onOpenRequestCoverage}
              data-testid="manage-request-coverage-button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-teal-400 border border-slate-700 hover:bg-slate-700 transition-colors ml-auto"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Request City</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-400">
          Showing{' '}
          <span className="text-white font-bold">{filteredSpots.length}</span>{' '}
          of <span className="text-teal-400 font-semibold">{spots.length}</span>{' '}
          saved spots
        </p>
      </div>

      {/* Spot Cards List or Empty State */}
      {filteredSpots.length === 0 ? (
        <div
          data-testid="spot-list-empty-state"
          className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-700/60 text-amber-400 flex items-center justify-center mx-auto">
            <SearchX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              No Saved Spots Match Your Filter
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Clear your active filters or clip a new family outing spot from
              Instagram.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleClearFilters}
              data-testid="spot-list-clear-filters-button"
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={onAddSpot}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors"
            >
              + Add Spot
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="spot-list-cards">
          {filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              userLocation={userLocation}
              isCustom={isCustomSpot(spot)}
              onEdit={onEditSpot}
              onDelete={onDeleteSpot}
            />
          ))}
        </div>
      )}
    </div>
  );
};

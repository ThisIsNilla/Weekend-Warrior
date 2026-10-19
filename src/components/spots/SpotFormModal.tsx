import React, { useState } from 'react';
import {
  Baby,
  Camera,
  Check,
  DollarSign,
  Flame,
  LocateFixed,
  MapPin,
  Search,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  CostLevel,
  EnergyLevel,
  LocationCoords,
  ParentAmenities,
  Spot,
  SpotCategory,
  SpotType,
} from '../../types';
import {
  COST_LEVELS,
  ENERGY_LEVELS,
  SPOT_CATEGORIES,
  SPOT_TYPES,
  isLocationCoords,
} from '../../types';
import type { GeocodingResult } from '../../services/geocodingService';
import { searchPlaces } from '../../services/geocodingService';
import {
  DEFAULT_CLIFTON_PARK_COORDS,
  getCurrentUserLocation,
} from '../../services/geolocationService';
import type { SpotFormDraft } from '../../utils/spotManagementHelpers';
import {
  applyGeocodeResultToDraft,
  applyLocationCoordsToDraft,
  createInitialSpotDraft,
  validateAndBuildSpot,
} from '../../utils/spotManagementHelpers';
import {
  formatCategoryLabel,
  formatSpotTypeLabel,
} from '../../utils/triageFormatters';

export interface SpotFormModalProps {
  isOpen: boolean;
  initialSpot?: Spot | null;
  userLocation?: LocationCoords;
  onSave: (spot: Spot) => void;
  onClose: () => void;
  initialGeocodeQuery?: string;
  initialGeocodeResults?: GeocodingResult[];
  initialError?: string | null;
  searchPlacesFn?: typeof searchPlaces;
  getLocationFn?: typeof getCurrentUserLocation;
}

const AMENITY_CHECKBOX_ITEMS: ReadonlyArray<{
  key: keyof ParentAmenities;
  label: string;
}> = [
  { key: 'strollerFriendly', label: 'Stroller Friendly' },
  { key: 'restroomsAvailable', label: 'Restrooms Available' },
  { key: 'fencedPlayArea', label: 'Fenced Play Area' },
  { key: 'snacksAllowedOrNearby', label: 'Snacks Allowed/Nearby' },
  { key: 'changingTablesAvailable', label: 'Changing Tables' },
  { key: 'parkingAvailable', label: 'Parking' },
];

export const SpotFormModal: React.FC<SpotFormModalProps> = ({
  isOpen,
  initialSpot = null,
  userLocation,
  onSave,
  onClose,
  initialGeocodeQuery = '',
  initialGeocodeResults = [],
  initialError = null,
  searchPlacesFn = searchPlaces,
  getLocationFn = getCurrentUserLocation,
}) => {
  const defaultCoords =
    userLocation && isLocationCoords(userLocation)
      ? userLocation
      : DEFAULT_CLIFTON_PARK_COORDS;

  const spotSessionKey = `${isOpen ? 'open' : 'closed'}:${
    initialSpot
      ? `${initialSpot.id}:${initialSpot.updatedAt ?? ''}`
      : 'add-new-spot'
  }`;

  const [trackedKey, setTrackedKey] = useState<string>(spotSessionKey);
  const [draft, setDraft] = useState<SpotFormDraft>(() =>
    createInitialSpotDraft(initialSpot, defaultCoords),
  );
  const [error, setError] = useState<string | null>(initialError);
  const [geocodeQuery, setGeocodeQuery] = useState<string>(initialGeocodeQuery);
  const [geocodeResults, setGeocodeResults] = useState<GeocodingResult[]>(
    initialGeocodeResults,
  );
  const [isSearchingGeocode, setIsSearchingGeocode] = useState<boolean>(false);

  if (trackedKey !== spotSessionKey) {
    setTrackedKey(spotSessionKey);
    setDraft(createInitialSpotDraft(initialSpot, defaultCoords));
    setError(initialError);
    setGeocodeQuery(initialGeocodeQuery);
    setGeocodeResults(initialGeocodeResults);
  }

  if (!isOpen) {
    return null;
  }

  const isEditing = Boolean(initialSpot);

  const resetModalState = () => {
    setDraft(createInitialSpotDraft(initialSpot, defaultCoords));
    setError(null);
    setGeocodeQuery('');
    setGeocodeResults([]);
  };

  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  const updateField = <K extends keyof SpotFormDraft>(
    key: K,
    value: SpotFormDraft[K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleAmenity = (key: keyof ParentAmenities) => {
    setDraft((prev) => ({
      ...prev,
      parentAmenities: {
        ...prev.parentAmenities,
        [key]: !prev.parentAmenities[key],
      },
    }));
  };

  const handleUseMyLocation = async () => {
    try {
      const geoResult = await getLocationFn();
      const resolvedCoords =
        !geoResult.isFallback && isLocationCoords(geoResult.coords)
          ? geoResult.coords
          : userLocation && isLocationCoords(userLocation)
            ? userLocation
            : geoResult.coords;

      setDraft((prev) => applyLocationCoordsToDraft(prev, resolvedCoords));
      setError(null);
    } catch {
      if (userLocation && isLocationCoords(userLocation)) {
        setDraft((prev) => applyLocationCoordsToDraft(prev, userLocation));
        setError(null);
      }
    }
  };

  const handleGeocodeSearch = async () => {
    const query = geocodeQuery.trim();
    if (!query) {
      setGeocodeResults([]);
      return;
    }

    setIsSearchingGeocode(true);
    try {
      const results = await searchPlacesFn(query, 5);
      setGeocodeResults(Array.isArray(results) ? results : []);
    } catch {
      setGeocodeResults([]);
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  const handleSelectGeocodeResult = (result: GeocodingResult) => {
    setDraft((prev) => applyGeocodeResultToDraft(prev, result));
    setGeocodeResults([]);
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const validation = validateAndBuildSpot(draft, initialSpot);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    onSave(validation.spot);
    resetModalState();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Spot' : 'Add Spot or Instagram Find'}
      data-testid="spot-form-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-slate-800 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Edit Outing Spot' : 'Add Spot / Instagram Find'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Close spot form modal"
            data-testid="close-spot-form-button"
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          data-testid="spot-form"
          className="space-y-4"
        >
          {error && (
            <div
              role="alert"
              data-testid="spot-form-error"
              className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {/* Instagram / Social Clipper Section */}
          <div className="bg-slate-900/80 border border-pink-500/30 rounded-2xl p-3.5 space-y-2.5">
            <p className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram / Social Clipper (Optional)</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="spot-source-handle-input"
                  className="text-[11px] font-semibold text-slate-300 block"
                >
                  Creator Handle
                </label>
                <input
                  id="spot-source-handle-input"
                  type="text"
                  value={draft.sourceHandle}
                  onChange={(e) => updateField('sourceHandle', e.target.value)}
                  placeholder="@capitaldistrictmoms"
                  data-testid="spot-source-handle-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="spot-source-url-input"
                  className="text-[11px] font-semibold text-slate-300 block"
                >
                  Instagram Post URL
                </label>
                <input
                  id="spot-source-url-input"
                  type="text"
                  value={draft.sourceUrl}
                  onChange={(e) => updateField('sourceUrl', e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  data-testid="spot-source-url-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>
          </div>

          {/* Core Spot Details */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="spot-name-input"
                className="text-xs font-semibold text-slate-200 block"
              >
                Spot Name *
              </label>
              <input
                id="spot-name-input"
                type="text"
                value={draft.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Clifton Common Playground"
                data-testid="spot-name-input"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label
                  htmlFor="spot-category-select"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  Category
                </label>
                <select
                  id="spot-category-select"
                  value={draft.category}
                  onChange={(e) =>
                    updateField('category', e.target.value as SpotCategory)
                  }
                  data-testid="spot-category-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  {SPOT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="spot-type-select"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  Indoor / Outdoor Setting
                </label>
                <select
                  id="spot-type-select"
                  value={draft.spotType}
                  onChange={(e) =>
                    updateField('spotType', e.target.value as SpotType)
                  }
                  data-testid="spot-type-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  {SPOT_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {formatSpotTypeLabel(st)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Energy Level & Cost Level */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label
                  htmlFor="spot-energy-select"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Energy Level</span>
                </label>
                <select
                  id="spot-energy-select"
                  value={draft.energyLevel}
                  onChange={(e) =>
                    updateField('energyLevel', e.target.value as EnergyLevel)
                  }
                  data-testid="spot-energy-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  {ENERGY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="spot-cost-select"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cost Level</span>
                </label>
                <select
                  id="spot-cost-select"
                  value={draft.costLevel}
                  onChange={(e) =>
                    updateField('costLevel', e.target.value as CostLevel)
                  }
                  data-testid="spot-cost-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  {COST_LEVELS.map((cost) => (
                    <option key={cost} value={cost}>
                      {cost === 'free' ? 'Free' : cost}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="spot-description-input"
                className="text-xs font-semibold text-slate-200 block"
              >
                Description & Parent Tips
              </label>
              <textarea
                id="spot-description-input"
                rows={2}
                value={draft.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Shaded play structures, great toddler swings, coffee nearby..."
                data-testid="spot-description-input"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label
                  htmlFor="spot-address-input"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  Street Address
                </label>
                <input
                  id="spot-address-input"
                  type="text"
                  value={draft.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="e.g. 19 Roosevelt Dr"
                  data-testid="spot-address-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="spot-city-input"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  City / Town
                </label>
                <input
                  id="spot-city-input"
                  type="text"
                  value={draft.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Saratoga Springs"
                  data-testid="spot-city-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Kid Age Suitability Checkboxes */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kid Age Suitability
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={draft.isToddlerFriendly}
                data-testid="spot-toddler-checkbox"
                onClick={() =>
                  updateField('isToddlerFriendly', !draft.isToddlerFriendly)
                }
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  draft.isToddlerFriendly
                    ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                    : 'bg-slate-900/70 border-slate-700 text-slate-400'
                }`}
              >
                <Baby className="w-4 h-4 shrink-0" />
                <span>Toddler Friendly (0-3)</span>
              </button>

              <button
                type="button"
                role="checkbox"
                aria-checked={draft.isYoungKidFriendly}
                data-testid="spot-young-kid-checkbox"
                onClick={() =>
                  updateField('isYoungKidFriendly', !draft.isYoungKidFriendly)
                }
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  draft.isYoungKidFriendly
                    ? 'bg-teal-400/15 border-teal-400 text-teal-300'
                    : 'bg-slate-900/70 border-slate-700 text-slate-400'
                }`}
              >
                <Smile className="w-4 h-4 shrink-0" />
                <span>Young Kids (4-7)</span>
              </button>
            </div>
          </div>

          {/* Parenting Amenities Checkboxes */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Parenting Amenities
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {AMENITY_CHECKBOX_ITEMS.map(({ key, label }) => {
                const checked = Boolean(draft.parentAmenities[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    data-testid={`amenity-checkbox-${key}`}
                    onClick={() => toggleAmenity(key)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left text-xs transition-colors ${
                      checked
                        ? 'bg-slate-900 border-teal-400/60 text-white font-semibold'
                        : 'bg-slate-900/50 border-slate-700/80 text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checked ? 'text-teal-400' : 'text-slate-600'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Coordinate Picker + Inline Geocoding Search */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Location & Coordinates</span>
              </p>

              <button
                type="button"
                onClick={handleUseMyLocation}
                data-testid="use-my-location-button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-400/15 hover:bg-teal-400/25 text-teal-300 border border-teal-400/30 text-[11px] font-semibold transition-colors"
              >
                <LocateFixed className="w-3 h-3" />
                <span>Use My Location</span>
              </button>
            </div>

            {/* Inline Venue / Address Search */}
            <div className="space-y-1.5">
              <label
                htmlFor="geocode-search-input"
                className="text-[11px] font-medium text-slate-400 block"
              >
                Venue or Town Lookup (Auto-fills coordinates & city)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="geocode-search-input"
                  type="text"
                  value={geocodeQuery}
                  onChange={(e) => setGeocodeQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (typeof e.preventDefault === 'function') {
                        e.preventDefault();
                      }
                      void handleGeocodeSearch();
                    }
                  }}
                  placeholder="Search place or town (e.g. Saratoga Springs)..."
                  data-testid="geocode-search-input"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="button"
                  onClick={handleGeocodeSearch}
                  disabled={isSearchingGeocode}
                  data-testid="geocode-search-button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearchingGeocode ? '...' : 'Lookup'}</span>
                </button>
              </div>

              {geocodeResults.length > 0 && (
                <div
                  data-testid="geocode-results-list"
                  className="bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700/80 overflow-hidden mt-1.5"
                >
                  {geocodeResults.map((result, idx) => (
                    <button
                      key={`${result.name}-${result.latitude}-${result.longitude}-${idx}`}
                      type="button"
                      data-testid={`geocode-result-item-${idx}`}
                      onClick={() => handleSelectGeocodeResult(result)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-700/80 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {result.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {[result.admin1, result.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-400 shrink-0">
                        {result.latitude.toFixed(3)}, {result.longitude.toFixed(3)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Latitude & Longitude Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label
                  htmlFor="spot-latitude-input"
                  className="text-[11px] font-semibold text-slate-300 block"
                >
                  Latitude (-90 to 90) *
                </label>
                <input
                  id="spot-latitude-input"
                  type="text"
                  inputMode="decimal"
                  value={draft.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  data-testid="spot-latitude-input"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="spot-longitude-input"
                  className="text-[11px] font-semibold text-slate-300 block"
                >
                  Longitude (-180 to 180) *
                </label>
                <input
                  id="spot-longitude-input"
                  type="text"
                  inputMode="decimal"
                  value={draft.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  data-testid="spot-longitude-input"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-700 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCloseModal}
              data-testid="cancel-spot-form-button"
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              data-testid="save-spot-button"
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Save Spot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

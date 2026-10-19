import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, Trash2 } from 'lucide-react';
import type { TriageCountOption, TriageFilter } from './types';
import { useGeolocation, useSpots, useWeather } from './hooks';
import { runTriage } from './utils/triageAlgorithm';
import {
  BottomNav,
  FallbackBanner,
  Header,
  QuickFilterChips,
  TriageButton,
  TriageFilterModal,
  TriageModeSelector,
  TriageResults,
  WeatherBanner,
} from './components';
import type { AppTab } from './components';

const DEFAULT_FILTER: TriageFilter = {
  countOption: 5,
};

const App: React.FC = () => {
  const {
    coords,
    loading: geoLoading,
    isFallback: isLocationFallback,
    errorMessage: locationError,
    refreshLocation,
  } = useGeolocation();

  const {
    weather,
    loading: weatherLoading,
    isFallback: isWeatherFallback,
    includeOutdoorAnyway,
    setIncludeOutdoorAnyway,
    refreshWeather,
  } = useWeather(coords);

  const { spots, deleteSpot, resetSpots } = useSpots();

  const [activeTab, setActiveTab] = useState<AppTab>('triage');
  const [filter, setFilter] = useState<TriageFilter>(DEFAULT_FILTER);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [hasTriaged, setHasTriaged] = useState<boolean>(false);
  const [rerollCounter, setRerollCounter] = useState<number>(0);

  const countOption: TriageCountOption =
    activeTab === 'nearby' ? 'all' : (filter.countOption ?? 5);

  const triageOutput = useMemo(() => {
    // Reference rerollCounter so clicking Reroll/Shuffle recomputes randomized stratification
    const shouldShuffle = rerollCounter > 0 && countOption !== 'all';
    return runTriage(
      spots,
      {
        ...filter,
        userLocation: coords,
        countOption,
      },
      weather,
      {
        includeOutdoorAnyway,
        shuffle: shouldShuffle,
      },
    );
  }, [spots, filter, coords, countOption, weather, includeOutdoorAnyway, rerollCounter]);

  const handleRefreshAll = async () => {
    const geoResult = await refreshLocation();
    await refreshWeather(true, geoResult.coords);
  };

  const handleSelectCount = (nextCount: TriageCountOption) => {
    setFilter((prev) => ({
      ...prev,
      countOption: nextCount,
    }));
  };

  const handleTriggerTriage = () => {
    setHasTriaged(true);
    setRerollCounter((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setFilter({
      countOption: filter.countOption ?? 5,
    });
    setIncludeOutdoorAnyway(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex justify-center overflow-x-hidden">
      <div
        data-testid="mobile-shell"
        className="w-full max-w-md min-h-screen bg-slate-900 text-slate-100 pt-safe pb-24 px-safe flex flex-col border-x border-slate-800/80 shadow-2xl overflow-x-hidden"
      >
        <Header
          coords={coords}
          isLocationFallback={isLocationFallback}
          weather={weather}
          isRefreshing={geoLoading || weatherLoading}
          onRefresh={handleRefreshAll}
        />

        <FallbackBanner
          isLocationFallback={isLocationFallback}
          isWeatherFallback={isWeatherFallback}
          locationErrorMessage={locationError}
          onRetry={handleRefreshAll}
        />

        <WeatherBanner
          weather={weather}
          includeOutdoorAnyway={includeOutdoorAnyway}
          onToggleIncludeOutdoor={setIncludeOutdoorAnyway}
        />

        <main className="flex-1 px-4 pt-4 space-y-4">
          {activeTab === 'triage' && (
            <>
              <TriageModeSelector
                selectedCount={filter.countOption ?? 5}
                onSelectCount={handleSelectCount}
              />

              <QuickFilterChips
                filter={filter}
                onChangeFilter={setFilter}
                onOpenModal={() => setIsFilterModalOpen(true)}
              />

              <TriageButton
                hasTriaged={hasTriaged}
                countOption={filter.countOption ?? 5}
                onClick={handleTriggerTriage}
              />

              <TriageResults
                candidates={triageOutput.candidates}
                totalCandidates={triageOutput.totalCandidates}
                countOption={filter.countOption ?? 5}
                onReroll={handleTriggerTriage}
                onResetFilters={handleResetFilters}
              />
            </>
          )}

          {activeTab === 'nearby' && (
            <div className="space-y-3" data-testid="nearby-feed-view">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={filter.searchQuery ?? ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  placeholder="Search nearby parks, museums, or towns..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                />
              </div>

              <QuickFilterChips
                filter={filter}
                onChangeFilter={setFilter}
                onOpenModal={() => setIsFilterModalOpen(true)}
              />

              <TriageResults
                candidates={triageOutput.candidates}
                totalCandidates={triageOutput.totalCandidates}
                countOption="all"
                onResetFilters={handleResetFilters}
              />
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-3" data-testid="manage-spots-view">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
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
                  onClick={() => resetSpots()}
                  data-testid="reset-seed-spots-button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-400 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Seeds</span>
                </button>
              </div>

              <div className="space-y-2">
                {spots.map((spot) => (
                  <div
                    key={spot.id}
                    className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {spot.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {spot.city ? `${spot.city} • ` : ''}
                        {spot.category.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSpot(spot.id)}
                      aria-label={`Delete ${spot.name}`}
                      className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <TriageFilterModal
          isOpen={isFilterModalOpen}
          filter={filter}
          onChangeFilter={setFilter}
          onResetFilters={handleResetFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />

        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalSpotsCount={spots.length}
        />
      </div>
    </div>
  );
};

export default App;

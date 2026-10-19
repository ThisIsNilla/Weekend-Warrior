import React, { useMemo, useState } from 'react';
import type { Spot, TriageCountOption, TriageFilter } from './types';
import { useGeolocation, useSpots, useWeather } from './hooks';
import { runTriage } from './utils/triageAlgorithm';
import {
  BottomNav,
  FallbackBanner,
  Header,
  NearbyFeedView,
  QuickFilterChips,
  RequestCoverageModal,
  SpotFormModal,
  SpotList,
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

export interface AppProps {
  initialTab?: AppTab;
}

const App: React.FC<AppProps> = ({ initialTab = 'triage' }) => {
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

  const { spots, addSpot, updateSpot, deleteSpot, resetSpots } = useSpots();

  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [filter, setFilter] = useState<TriageFilter>(DEFAULT_FILTER);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [hasTriaged, setHasTriaged] = useState<boolean>(false);
  const [rerollCounter, setRerollCounter] = useState<number>(0);

  const [isSpotModalOpen, setIsSpotModalOpen] = useState<boolean>(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] =
    useState<boolean>(false);

  const countOption: TriageCountOption =
    activeTab === 'nearby' ? 'all' : (filter.countOption ?? 5);

  const triageOutput = useMemo(() => {
    // Reference rerollCounter so clicking Reroll/Shuffle recomputes randomized stratification
    const shouldShuffle = rerollCounter > 0 && countOption !== 'all';
    return runTriage(
      spots,
      {
        ...filter,
        maxProximityBand:
          activeTab === 'nearby' ? undefined : filter.maxProximityBand,
        userLocation: coords,
        countOption,
      },
      weather,
      {
        includeOutdoorAnyway,
        shuffle: shouldShuffle,
      },
    );
  }, [
    spots,
    filter,
    activeTab,
    coords,
    countOption,
    weather,
    includeOutdoorAnyway,
    rerollCounter,
  ]);

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

  const handleOpenAddSpot = () => {
    setEditingSpot(null);
    setIsSpotModalOpen(true);
  };

  const handleOpenEditSpot = (spot: Spot) => {
    setEditingSpot(spot);
    setIsSpotModalOpen(true);
  };

  const handleSaveSpot = (spot: Spot) => {
    const exists = spots.some((existing) => existing.id === spot.id);
    if (exists) {
      updateSpot(spot);
    } else {
      addSpot(spot);
    }
    setEditingSpot(null);
    setIsSpotModalOpen(false);
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
            <NearbyFeedView
              candidates={triageOutput.candidates}
              totalCandidates={spots.length}
              filter={filter}
              onChangeFilter={setFilter}
              onResetFilters={handleResetFilters}
              onOpenFilterModal={() => setIsFilterModalOpen(true)}
              onOpenRequestCoverage={() => setIsCoverageModalOpen(true)}
              onOpenAddSpot={handleOpenAddSpot}
            />
          )}

          {(activeTab === 'manage' || activeTab === 'spots') && (
            <SpotList
              spots={spots}
              userLocation={coords}
              onAddSpot={handleOpenAddSpot}
              onEditSpot={handleOpenEditSpot}
              onDeleteSpot={deleteSpot}
              onResetSpots={resetSpots}
              onOpenRequestCoverage={() => setIsCoverageModalOpen(true)}
            />
          )}
        </main>

        <TriageFilterModal
          isOpen={isFilterModalOpen}
          filter={filter}
          onChangeFilter={setFilter}
          onResetFilters={handleResetFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />

        <SpotFormModal
          isOpen={isSpotModalOpen}
          initialSpot={editingSpot}
          userLocation={coords}
          onSave={handleSaveSpot}
          onClose={() => {
            setIsSpotModalOpen(false);
            setEditingSpot(null);
          }}
        />

        <RequestCoverageModal
          isOpen={isCoverageModalOpen}
          onClose={() => setIsCoverageModalOpen(false)}
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

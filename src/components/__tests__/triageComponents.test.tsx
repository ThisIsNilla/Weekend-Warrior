import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TriageCandidate, WeatherState } from '../../types';
import { SEED_SPOTS } from '../../storage/seedData';
import { DEFAULT_CLIFTON_PARK_COORDS } from '../../services/geolocationService';
import {
  BottomNav,
  FallbackBanner,
  Header,
  QuickFilterChips,
  TriageButton,
  TriageCard,
  TriageFilterModal,
  TriageModeSelector,
  TriageResults,
  WeatherBanner,
} from '../index';
import {
  countActiveFilters,
  formatEnergyContextLabel,
  resolveInstagramUrl,
} from '../../utils/triageFormatters';
import App from '../../App';

describe('Phase 3 Core UI & Triage Components', () => {
  const sampleWeather: WeatherState = {
    temperatureF: 72,
    condition: 'clear',
    isRaining: false,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const rainyWeather: WeatherState = {
    temperatureF: 54,
    condition: 'rain',
    isRaining: true,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const sampleCandidate: TriageCandidate = {
    spot: {
      ...SEED_SPOTS[0],
      isToddlerFriendly: true,
      isYoungKidFriendly: true,
      sourceHandle: '@thecrossingsofcolonie',
      sourceUrl: 'https://www.instagram.com/p/sample123/',
    },
    distanceMiles: 6.4,
    proximityBand: 'short_drive',
    weatherFitScore: 100,
    overallScore: 92,
    matchReasons: ['Quick drive (6.4 mi)', 'Free outing'],
    cautions: ['Bring water on sunny days'],
  };

  describe('Header', () => {
    it('renders GPS coordinates pill, live weather badge, and refresh button', () => {
      const html = renderToStaticMarkup(
        <Header
          coords={DEFAULT_CLIFTON_PARK_COORDS}
          isLocationFallback={false}
          weather={sampleWeather}
          onRefresh={() => {}}
        />,
      );

      expect(html).toContain('Weekend Warrior');
      expect(html).toContain('42.85');
      expect(html).toContain('-73.82');
      expect(html).toContain('72°F');
      expect(html).toContain('Clear');
    });

    it('renders default Clifton Park label when isLocationFallback is true', () => {
      const html = renderToStaticMarkup(
        <Header
          coords={DEFAULT_CLIFTON_PARK_COORDS}
          isLocationFallback={true}
          weather={sampleWeather}
          onRefresh={() => {}}
        />,
      );

      expect(html).toContain('Clifton Park, NY (Default)');
    });
  });

  describe('WeatherBanner', () => {
    it('renders nothing when weather is dry and clear', () => {
      const html = renderToStaticMarkup(
        <WeatherBanner
          weather={sampleWeather}
          includeOutdoorAnyway={false}
          onToggleIncludeOutdoor={() => {}}
        />,
      );
      expect(html).toBe('');
    });

    it('renders rain alert banner and interactive outdoor toggle switch during precipitation', () => {
      const html = renderToStaticMarkup(
        <WeatherBanner
          weather={rainyWeather}
          includeOutdoorAnyway={true}
          onToggleIncludeOutdoor={() => {}}
        />,
      );
      expect(html).toContain('Weather Alert');
      expect(html).toContain('Include outdoor spots anyway');
      expect(html).toContain('aria-checked="true"');
    });
  });

  describe('FallbackBanner', () => {
    it('renders nothing when neither location nor weather is in fallback mode', () => {
      const html = renderToStaticMarkup(
        <FallbackBanner isLocationFallback={false} isWeatherFallback={false} />,
      );
      expect(html).toBe('');
    });

    it('renders fallback notice when using default GPS coordinates', () => {
      const html = renderToStaticMarkup(
        <FallbackBanner
          isLocationFallback={true}
          isWeatherFallback={false}
          onRetry={() => {}}
        />,
      );
      expect(html).toContain('Clifton Park / Halfmoon');
      expect(html).toContain('Retry');
    });
  });

  describe('TriageModeSelector & TriageButton', () => {
    it('renders all 4 option count tabs (Quick 3, Top 5, Top 10, All Nearby)', () => {
      const html = renderToStaticMarkup(
        <TriageModeSelector selectedCount={5} onSelectCount={() => {}} />,
      );
      expect(html).toContain('Quick 3');
      expect(html).toContain('Top 5');
      expect(html).toContain('Top 10');
      expect(html).toContain('All Nearby');
    });

    it('renders Triage: Pick Options initially and Reroll Options after triaging', () => {
      const initialHtml = renderToStaticMarkup(
        <TriageButton hasTriaged={false} countOption={3} onClick={() => {}} />,
      );
      expect(initialHtml).toContain('Triage: Pick Options');
      expect(initialHtml).toContain('Top 3');

      const rerollHtml = renderToStaticMarkup(
        <TriageButton hasTriaged={true} countOption="all" onClick={() => {}} />,
      );
      expect(rerollHtml).toContain('Reroll Options');
      expect(rerollHtml).toContain('All Nearby');
    });
  });

  describe('TriageCard', () => {
    it('renders spot details, kid badges, parenting energy context, amenities, Instagram link, and Open in Maps button', () => {
      const html = renderToStaticMarkup(
        <TriageCard candidate={sampleCandidate} rank={1} />,
      );

      expect(html).toContain(sampleCandidate.spot.name);
      expect(html).toContain('6.4 mi');
      expect(html).toContain('Short Drive');
      expect(html).toContain('Toddler Friendly');
      expect(html).toContain('Young Kids');
      expect(html).toContain('Medium: Museum / Park');
      expect(html).toContain('Stroller Friendly');
      expect(html).toContain('Restrooms');
      expect(html).toContain('Fenced Play Area');
      expect(html).toContain('Snacks Nearby');
      expect(html).toContain('View Post (@thecrossingsofcolonie)');
      expect(html).toContain('Open in Maps');
    });

    it('formats parenting energy context labels accurately', () => {
      expect(formatEnergyContextLabel('low')).toBe('Low: Stroller / Ice Cream');
      expect(formatEnergyContextLabel('medium')).toBe('Medium: Museum / Park');
      expect(formatEnergyContextLabel('high')).toBe('High: Burn Kids Energy');
    });

    it('resolves Instagram URLs safely and rejects unsafe schemes', () => {
      expect(
        resolveInstagramUrl('https://www.instagram.com/p/abc/', '@handle'),
      ).toBe('https://www.instagram.com/p/abc/');
      expect(resolveInstagramUrl(undefined, '@cliftonparkmom')).toBe(
        'https://www.instagram.com/cliftonparkmom/',
      );
      expect(resolveInstagramUrl('javascript:alert(1)', '@safe_handle')).toBe(
        'https://www.instagram.com/safe_handle/',
      );
      expect(resolveInstagramUrl('javascript:alert(1)', undefined)).toBeNull();
      expect(resolveInstagramUrl(undefined, undefined)).toBeNull();
    });

    it('invokes onOpenMaps callback when Open in Maps button is clicked', () => {
      const onOpenMaps = vi.fn();
      const tree = TriageCard({
        candidate: sampleCandidate,
        rank: 1,
        onOpenMaps,
      });
      const button = getElementByTestId(tree, 'open-in-maps-button');
      (button.props.onClick as () => void)();
      expect(onOpenMaps).toHaveBeenCalledWith(sampleCandidate);
    });
  });

  describe('TriageResults', () => {
    it('renders candidate cards and count summary when candidates are present', () => {
      const onReroll = vi.fn();
      const html = renderToStaticMarkup(
        <TriageResults
          candidates={[sampleCandidate]}
          totalCandidates={15}
          countOption={3}
          onReroll={onReroll}
        />,
      );
      expect(html).toContain(sampleCandidate.spot.name);
      expect(html).toContain('matching spots');
      expect(html).toContain('Shuffle');

      const tree = TriageResults({
        candidates: [sampleCandidate],
        totalCandidates: 15,
        countOption: 3,
        onReroll,
      });
      const shuffleBtn = getElementByTestId(tree, 'results-shuffle-button');
      (shuffleBtn.props.onClick as () => void)();
      expect(onReroll).toHaveBeenCalledTimes(1);
    });

    it('renders empty state with Reset All Filters action when no candidates match', () => {
      const onReset = vi.fn();
      const html = renderToStaticMarkup(
        <TriageResults
          candidates={[]}
          totalCandidates={0}
          countOption={5}
          onResetFilters={onReset}
        />,
      );
      expect(html).toContain('No Matching Outings Found');
      expect(html).toContain('Reset All Filters');

      const tree = TriageResults({
        candidates: [],
        totalCandidates: 0,
        countOption: 5,
        onResetFilters: onReset,
      });
      const resetBtn = getElementByTestId(tree, 'empty-reset-filters-button');
      (resetBtn.props.onClick as () => void)();
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('TriageFilterModal & QuickFilterChips', () => {
    it('renders quick filter chips, counts all active filters, and handles chip toggles', () => {
      const filter = {
        requireToddlerFriendly: true,
        costLevels: ['free' as const],
        maxDistanceMiles: 10,
        categories: ['museum' as const],
        requiredAmenities: { strollerFriendly: true },
      };
      expect(countActiveFilters(filter)).toBe(5);

      const onChangeFilter = vi.fn();
      const chipsHtml = renderToStaticMarkup(
        <QuickFilterChips
          filter={filter}
          onChangeFilter={onChangeFilter}
          onOpenModal={() => {}}
        />,
      );
      expect(chipsHtml).toContain('Toddler (0-3)');
      expect(chipsHtml).toContain('Young Kids (4-7)');
      expect(chipsHtml).toContain('Free Only');

      const chipsTree = QuickFilterChips({
        filter,
        onChangeFilter,
        onOpenModal: () => {},
      });
      const toddlerChip = getElementByTestId(chipsTree, 'quick-chip-toddler');
      (toddlerChip.props.onClick as () => void)();
      expect(onChangeFilter).toHaveBeenCalledWith({
        ...filter,
        requireToddlerFriendly: false,
      });
    });

    it('renders filter modal controls and handles interactive toggles and slider when open', () => {
      const onChange = vi.fn();
      const modalHtml = renderToStaticMarkup(
        <TriageFilterModal
          isOpen={true}
          filter={{ requireToddlerFriendly: true }}
          onChangeFilter={onChange}
          onResetFilters={() => {}}
          onClose={() => {}}
        />,
      );
      expect(modalHtml).toContain('Triage Filters');
      expect(modalHtml).toContain('Toddler Friendly (Ages 0 to 3)');
      expect(modalHtml).toContain('Young Kids (Ages 4 to 7)');
      expect(modalHtml).toContain('Free Outings Only');
      expect(modalHtml).toContain('Max Distance Radius');
      expect(modalHtml).toContain('distance-radius-slider');
      expect(modalHtml).toContain('Energy Level');

      const modalTree = TriageFilterModal({
        isOpen: true,
        filter: { requireToddlerFriendly: true },
        onChangeFilter: onChange,
        onResetFilters: () => {},
        onClose: () => {},
      });
      const slider = getElementByTestId(modalTree, 'distance-radius-slider');
      (slider.props.onChange as (e: { target: { value: string } }) => void)({
        target: { value: '15' },
      });
      expect(onChange).toHaveBeenCalledWith({
        requireToddlerFriendly: true,
        maxDistanceMiles: 15,
      });
    });
  });

  describe('BottomNav & App Shell', () => {
    it('renders bottom navigation tabs (Triage, Nearby Feed, Manage Spots) and handles tab selection', () => {
      const onSelectTab = vi.fn();
      const navHtml = renderToStaticMarkup(
        <BottomNav
          activeTab="triage"
          onSelectTab={onSelectTab}
          totalSpotsCount={20}
        />,
      );
      expect(navHtml).toContain('Triage');
      expect(navHtml).toContain('Nearby Feed');
      expect(navHtml).toContain('Manage Spots');
      expect(navHtml).toContain('20');

      const navTree = BottomNav({
        activeTab: 'triage',
        onSelectTab,
        totalSpotsCount: 20,
      });
      const nearbyTab = getElementByTestId(navTree, 'nav-tab-nearby');
      (nearbyTab.props.onClick as () => void)();
      expect(onSelectTab).toHaveBeenCalledWith('nearby');
    });

    it('renders complete App mobile shell without errors', () => {
      const appHtml = renderToStaticMarkup(<App />);
      expect(appHtml).toContain('Weekend Warrior');
      expect(appHtml).toContain('Quick 3');
      expect(appHtml).toContain('Top 5');
      expect(appHtml).toContain('Triage: Pick Options');
    });
  });
});

function findElementByTestId(
  node: unknown,
  testId: string,
): { props: Record<string, unknown> } | undefined {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementByTestId(child, testId);
      if (found) return found;
    }
    return undefined;
  }
  const element = node as { props?: Record<string, unknown> };
  if (element.props) {
    if (element.props['data-testid'] === testId) {
      return element as { props: Record<string, unknown> };
    }
    if (element.props.children) {
      return findElementByTestId(element.props.children, testId);
    }
  }
  return undefined;
}

function getElementByTestId(
  node: unknown,
  testId: string,
): { props: Record<string, unknown> } {
  const found = findElementByTestId(node, testId);
  if (!found) {
    throw new Error(`Element with data-testid="${testId}" not found`);
  }
  return found;
}

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Spot, TriageCandidate } from '../../types';
import { SEED_SPOTS } from '../../storage/seedData';
import { DEFAULT_CLIFTON_PARK_COORDS } from '../../services/geolocationService';
import {
  clearCoverageRequests,
  getCoverageRequests,
} from '../../services/communityQueueService';
import {
  NearbyFeedView,
  RequestCoverageModal,
  SpotCard,
  SpotFormModal,
  SpotList,
  applyGeocodeResultToDraft,
  applyLocationCoordsToDraft,
  createInitialSpotDraft,
  filterManagedSpots,
  groupCandidatesByProximityBand,
  hasInstagramSource,
  isCustomSpot,
  resolveFeedProximityBand,
  validateAndBuildSpot,
} from '../index';
import App from '../../App';

describe('Phase 4 Proximity Feed, Community Coverage, Instagram Clipper & Spot Management', () => {
  beforeEach(() => {
    clearCoverageRequests();
  });

  const sampleCandidates: TriageCandidate[] = [
    {
      spot: {
        ...SEED_SPOTS[0],
        id: 'spot-far',
        name: 'Adirondack Day Trip Park',
      },
      distanceMiles: 38.4,
      proximityBand: 'day_trip',
      weatherFitScore: 100,
      overallScore: 72,
      matchReasons: ['Great weather for outdoor play'],
    },
    {
      spot: {
        ...SEED_SPOTS[1],
        id: 'spot-walk',
        name: 'Clifton Common Playground',
      },
      distanceMiles: 1.2,
      proximityBand: 'walking',
      weatherFitScore: 100,
      overallScore: 96,
      matchReasons: ['Walking distance (1.2 mi)'],
    },
    {
      spot: {
        ...SEED_SPOTS[2],
        id: 'spot-short',
        name: 'Shenendehowa Library Storytime',
      },
      distanceMiles: 7.5,
      proximityBand: 'short_drive',
      weatherFitScore: 100,
      overallScore: 89,
      matchReasons: ['Quick drive (7.5 mi)'],
    },
    {
      spot: {
        ...SEED_SPOTS[3],
        id: 'spot-medium',
        name: 'Albany State Museum',
      },
      distanceMiles: 18.6,
      proximityBand: 'medium_drive',
      weatherFitScore: 100,
      overallScore: 83,
      matchReasons: ['Free outing'],
    },
  ];

  describe('NearbyFeedView', () => {
    it('classifies and groups candidates by ascending distance across all 4 proximity bands and respects maxProximityBand', () => {
      expect(
        resolveFeedProximityBand({
          ...sampleCandidates[1],
          distanceMiles: 3.9,
        }),
      ).toBe('walking');
      expect(
        resolveFeedProximityBand({
          ...sampleCandidates[2],
          distanceMiles: 8.2,
        }),
      ).toBe('short_drive');
      expect(
        resolveFeedProximityBand({
          ...sampleCandidates[3],
          distanceMiles: 22.0,
        }),
      ).toBe('medium_drive');
      expect(
        resolveFeedProximityBand({
          ...sampleCandidates[0],
          distanceMiles: 34.5,
        }),
      ).toBe('day_trip');

      const grouped = groupCandidatesByProximityBand(sampleCandidates);
      expect(grouped.map((g) => g.band)).toEqual([
        'walking',
        'short_drive',
        'medium_drive',
        'day_trip',
      ]);
      expect(grouped[0].candidates[0].spot.name).toBe(
        'Clifton Common Playground',
      );
      expect(grouped[1].candidates[0].spot.name).toBe(
        'Shenendehowa Library Storytime',
      );
      expect(grouped[2].candidates[0].spot.name).toBe('Albany State Museum');
      expect(grouped[3].candidates[0].spot.name).toBe(
        'Adirondack Day Trip Park',
      );

      // Filtering with maxProximityBand='short_drive' keeps walking (< 5 mi) and short_drive (5..15 mi)
      const shortDriveGrouped = groupCandidatesByProximityBand(
        [
          ...sampleCandidates,
          {
            ...sampleCandidates[1],
            spot: {
              ...sampleCandidates[1].spot,
              id: 'spot-walk-3mi',
              name: 'Three Mile Neighborhood Park',
            },
            distanceMiles: 3.2,
          },
        ],
        { maxProximityBand: 'short_drive' },
      );
      expect(shortDriveGrouped.map((g) => g.band)).toEqual([
        'walking',
        'short_drive',
      ]);
      expect(shortDriveGrouped[0].candidates).toHaveLength(2);
    });

    it('renders proximity band headers, search input, category pills, quick kid/free toggles, and Request Coverage CTA', () => {
      const onChangeFilter = vi.fn();
      const onOpenRequestCoverage = vi.fn();

      const html = renderToStaticMarkup(
        <NearbyFeedView
          candidates={sampleCandidates}
          totalCandidates={20}
          filter={{ countOption: 'all' }}
          onChangeFilter={onChangeFilter}
          onResetFilters={() => {}}
          onOpenRequestCoverage={onOpenRequestCoverage}
        />,
      );

      expect(html).toContain('Walking &amp; Close By');
      expect(html).toContain('&lt; 5 miles');
      expect(html).toContain('Short Drive');
      expect(html).toContain('5 to 15 miles');
      expect(html).toContain('Medium Drive');
      expect(html).toContain('15 to 30 miles');
      expect(html).toContain('Day Trip');
      expect(html).toContain('30+ miles');
      expect(html).toContain('All Categories');
      expect(html).toContain('Request Coverage for My City');

      const tree = renderAndCaptureTree(NearbyFeedView, {
        candidates: sampleCandidates,
        totalCandidates: 20,
        filter: { countOption: 'all' },
        onChangeFilter,
        onResetFilters: () => {},
        onOpenRequestCoverage,
      });

      const searchInput = getElementByTestId(tree, 'nearby-search-input');
      (
        searchInput.props.onChange as (e: { target: { value: string } }) => void
      )({
        target: { value: 'Saratoga' },
      });
      expect(onChangeFilter).toHaveBeenCalledWith({
        countOption: 'all',
        searchQuery: 'Saratoga',
      });

      const museumPill = getElementByTestId(tree, 'category-pill-museum');
      (museumPill.props.onClick as () => void)();
      expect(onChangeFilter).toHaveBeenCalledWith({
        countOption: 'all',
        categories: ['museum'],
      });

      const coverageBtn = getElementByTestId(
        tree,
        'open-request-coverage-button',
      );
      (coverageBtn.props.onClick as () => void)();
      expect(onOpenRequestCoverage).toHaveBeenCalledTimes(1);
    });

    it('filters displayed candidates directly when filter prop is active and renders empty state when none match', () => {
      const onReset = vi.fn();
      const onRequest = vi.fn();

      // Passing non-empty candidates with a non-matching searchQuery triggers the empty state
      const html = renderToStaticMarkup(
        <NearbyFeedView
          candidates={sampleCandidates}
          totalCandidates={20}
          filter={{ searchQuery: 'nonexistent-query-xyz' }}
          onChangeFilter={() => {}}
          onResetFilters={onReset}
          onOpenRequestCoverage={onRequest}
        />,
      );

      expect(html).toContain('No Nearby Spots Match Your Filters');
      expect(html).toContain('Reset Filters');
      expect(html).toContain('Request My City');
    });
  });

  describe('RequestCoverageModal', () => {
    it('renders nothing when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <RequestCoverageModal isOpen={false} onClose={() => {}} />,
      );
      expect(html).toBe('');
    });

    it('renders coverage request form and submits valid city coverage request to communityQueueService', () => {
      const onSubmitted = vi.fn();
      const formHtml = renderToStaticMarkup(
        <RequestCoverageModal
          isOpen={true}
          onClose={() => {}}
          onSubmitted={onSubmitted}
          initialCityName="Burlington"
          initialStateOrZip="VT"
          initialHandlesInput="@burlingtonmoms, @vtfamily"
          initialParentNotes="Please add waterfront playground"
        />,
      );

      expect(formHtml).toContain('Request Coverage for My City');
      expect(formHtml).toContain('Burlington');
      expect(formHtml).toContain('VT');

      const tree = renderAndCaptureTree(RequestCoverageModal, {
        isOpen: true,
        onClose: () => {},
        onSubmitted,
        initialCityName: 'Burlington',
        initialStateOrZip: 'VT',
        initialHandlesInput: '@burlingtonmoms, @vtfamily',
        initialParentNotes: 'Please add waterfront playground',
      });

      const form = getElementByTestId(tree, 'coverage-request-form');
      (form.props.onSubmit as (e: { preventDefault: () => void }) => void)({
        preventDefault: () => {},
      });

      expect(onSubmitted).toHaveBeenCalledTimes(1);
      const saved = getCoverageRequests();
      expect(saved).toHaveLength(1);
      expect(saved[0].cityName).toBe('Burlington');
      expect(saved[0].stateOrZip).toBe('VT');
      expect(saved[0].suggestedInstagramHandles).toEqual([
        '@burlingtonmoms',
        '@vtfamily',
      ]);
    });

    it('renders confirmation feedback view, validation errors, and invokes onClose cleanly from Done button', () => {
      const savedReq = {
        id: 'cov-test-1',
        cityName: 'Portland',
        stateOrZip: 'ME',
        suggestedInstagramHandles: ['@portlandmainekids'],
        parentNotes: 'Children Museum & Theatre of Maine',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      const onClose = vi.fn();

      const confirmHtml = renderToStaticMarkup(
        <RequestCoverageModal
          isOpen={true}
          onClose={onClose}
          initialSubmittedRequest={savedReq}
        />,
      );
      expect(confirmHtml).toContain('City Coverage Queued!');
      expect(confirmHtml).toContain('Portland, ME');
      expect(confirmHtml).toContain('@portlandmainekids');
      expect(confirmHtml).toContain('Children Museum &amp; Theatre of Maine');

      const confirmTree = renderAndCaptureTree(RequestCoverageModal, {
        isOpen: true,
        onClose,
        initialSubmittedRequest: savedReq,
      });
      const doneBtn = getElementByTestId(confirmTree, 'coverage-done-button');
      (doneBtn.props.onClick as () => void)();
      expect(onClose).toHaveBeenCalledTimes(1);

      const errorHtml = renderToStaticMarkup(
        <RequestCoverageModal
          isOpen={true}
          onClose={() => {}}
          initialError="City or town name is required"
        />,
      );
      expect(errorHtml).toContain('City or town name is required');
    });
  });

  describe('SpotFormModal & Validation', () => {
    it('validates spot form draft inputs for required name, coordinate boundaries (-90..90, -180..180), and Instagram URL/handle format', () => {
      const baseDraft = createInitialSpotDraft(
        null,
        DEFAULT_CLIFTON_PARK_COORDS,
      );

      // Empty name fails
      const emptyNameResult = validateAndBuildSpot({
        ...baseDraft,
        name: '   ',
      });
      expect(emptyNameResult.valid).toBe(false);
      if (!emptyNameResult.valid) {
        expect(emptyNameResult.error).toContain('Spot name is required');
      }

      // Latitude out of range fails
      const invalidLatLow = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        latitude: '-91',
      });
      expect(invalidLatLow.valid).toBe(false);

      const invalidLatHigh = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        latitude: '95.5',
      });
      expect(invalidLatHigh.valid).toBe(false);

      // Longitude out of range fails
      const invalidLonLow = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        longitude: '-181',
      });
      expect(invalidLonLow.valid).toBe(false);

      const invalidLonHigh = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        longitude: '180.5',
      });
      expect(invalidLonHigh.valid).toBe(false);

      // Malformed Instagram URL fails
      const invalidUrlResult = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        sourceUrl: 'javascript:alert(1)',
      });
      expect(invalidUrlResult.valid).toBe(false);
      if (!invalidUrlResult.valid) {
        expect(invalidUrlResult.error).toContain('Instagram post URL');
      }

      // Invalid special-character-only handle fails
      const invalidHandleResult = validateAndBuildSpot({
        ...baseDraft,
        name: 'Test Park',
        sourceHandle: '@!@#$%',
      });
      expect(invalidHandleResult.valid).toBe(false);
      if (!invalidHandleResult.valid) {
        expect(invalidHandleResult.error).toContain('Instagram creator handle');
      }

      // Boundary values (-90, 90, -180, 180) and handle/URL normalization succeed
      const validBoundary = validateAndBuildSpot({
        ...baseDraft,
        name: 'Boundary Outing Spot',
        latitude: '-90',
        longitude: '180',
        sourceHandle: 'https://www.instagram.com/capitaldistrictmoms/',
        sourceUrl: 'instagram.com/p/clip123/',
        parentAmenities: {
          strollerFriendly: true,
          restroomsAvailable: true,
          fencedPlayArea: true,
          snacksAllowedOrNearby: true,
          changingTablesAvailable: true,
          parkingAvailable: true,
        },
      });

      expect(validBoundary.valid).toBe(true);
      if (validBoundary.valid) {
        expect(validBoundary.spot.name).toBe('Boundary Outing Spot');
        expect(validBoundary.spot.coordinates.latitude).toBe(-90);
        expect(validBoundary.spot.coordinates.longitude).toBe(180);
        expect(validBoundary.spot.sourceHandle).toBe('@capitaldistrictmoms');
        expect(validBoundary.spot.sourceUrl).toBe(
          'https://instagram.com/p/clip123/',
        );
        expect(validBoundary.spot.parentAmenities.changingTablesAvailable).toBe(
          true,
        );
        expect(validBoundary.spot.parentAmenities.parkingAvailable).toBe(true);
      }
    });

    it('auto-fills coordinates and city via applyGeocodeResultToDraft and applyLocationCoordsToDraft', () => {
      const initialDraft = createInitialSpotDraft(
        null,
        DEFAULT_CLIFTON_PARK_COORDS,
      );

      const afterGeocode = applyGeocodeResultToDraft(initialDraft, {
        name: 'Saratoga Springs',
        admin1: 'New York',
        country: 'United States',
        latitude: 43.0831,
        longitude: -73.7846,
      });
      expect(afterGeocode.city).toBe('Saratoga Springs');
      expect(afterGeocode.name).toBe('Saratoga Springs');
      expect(afterGeocode.latitude).toBe('43.0831');
      expect(afterGeocode.longitude).toBe('-73.7846');

      const afterGps = applyLocationCoordsToDraft(afterGeocode, {
        latitude: 42.6526,
        longitude: -73.7562,
      });
      expect(afterGps.latitude).toBe('42.6526');
      expect(afterGps.longitude).toBe('-73.7562');
    });

    it('renders all add/edit fields, handles Enter key on geocode search without submitting form, and invokes live GPS lookup', async () => {
      const existingSpot = SEED_SPOTS[0];
      const secondSpot = SEED_SPOTS[1];
      const onSave = vi.fn();
      const onClose = vi.fn();
      const searchPlacesFn = vi.fn().mockResolvedValue([
        {
          name: 'Saratoga Springs',
          admin1: 'New York',
          country: 'United States',
          latitude: 43.0831,
          longitude: -73.7846,
        },
      ]);
      const getLocationFn = vi.fn().mockResolvedValue({
        coords: { latitude: 42.9999, longitude: -73.8888 },
        isFallback: false,
        source: 'browser' as const,
      });

      const htmlFirst = renderToStaticMarkup(
        <SpotFormModal
          isOpen={true}
          initialSpot={existingSpot}
          userLocation={DEFAULT_CLIFTON_PARK_COORDS}
          onSave={onSave}
          onClose={onClose}
          initialGeocodeResults={[
            {
              name: 'Saratoga Springs',
              admin1: 'New York',
              country: 'United States',
              latitude: 43.0831,
              longitude: -73.7846,
            },
          ]}
        />,
      );

      expect(htmlFirst).toContain('Edit Outing Spot');
      expect(htmlFirst).toContain(existingSpot.name);
      expect(htmlFirst).toContain('Instagram / Social Clipper');
      expect(htmlFirst).toContain('Toddler Friendly (0-3)');
      expect(htmlFirst).toContain('Young Kids (4-7)');
      expect(htmlFirst).toContain('Stroller Friendly');
      expect(htmlFirst).toContain('Restrooms Available');
      expect(htmlFirst).toContain('Fenced Play Area');
      expect(htmlFirst).toContain('Snacks Allowed/Nearby');
      expect(htmlFirst).toContain('Changing Tables');
      expect(htmlFirst).toContain('Parking');
      expect(htmlFirst).toContain('Use My Location');
      expect(htmlFirst).toContain('Saratoga Springs');
      expect(htmlFirst).toContain('43.083, -73.785');

      // Render with a second spot to verify editing another spot updates form values
      const htmlSecond = renderToStaticMarkup(
        <SpotFormModal
          isOpen={true}
          initialSpot={secondSpot}
          userLocation={DEFAULT_CLIFTON_PARK_COORDS}
          onSave={onSave}
          onClose={onClose}
        />,
      );
      expect(htmlSecond).toContain(secondSpot.name);

      const tree = renderAndCaptureTree(SpotFormModal, {
        isOpen: true,
        initialSpot: existingSpot,
        userLocation: DEFAULT_CLIFTON_PARK_COORDS,
        onSave,
        onClose,
        initialGeocodeQuery: 'Saratoga Springs',
        searchPlacesFn,
        getLocationFn,
      });

      // Pressing Enter inside geocode-search-input triggers geocode search and does NOT submit the spot form
      const geocodeInput = getElementByTestId(tree, 'geocode-search-input');
      const preventDefaultSpy = vi.fn();
      (
        geocodeInput.props.onKeyDown as (e: {
          key: string;
          preventDefault: () => void;
        }) => void
      )({
        key: 'Enter',
        preventDefault: preventDefaultSpy,
      });
      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(searchPlacesFn).toHaveBeenCalledWith('Saratoga Springs', 5);
      expect(onSave).not.toHaveBeenCalled();

      // Clicking Use My Location invokes getLocationFn for live GPS coordinates
      const gpsButton = getElementByTestId(tree, 'use-my-location-button');
      await (gpsButton.props.onClick as () => Promise<void>)();
      expect(getLocationFn).toHaveBeenCalledTimes(1);

      // Submitting the form saves the spot and closes the modal
      const form = getElementByTestId(tree, 'spot-form');
      (form.props.onSubmit as (e: { preventDefault: () => void }) => void)({
        preventDefault: () => {},
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].id).toBe(existingSpot.id);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('SpotCard', () => {
    it('renders spot details, kid badges, amenities, Instagram link, live distance, and handles Edit and Delete actions', () => {
      const customSpot: Spot = {
        ...SEED_SPOTS[0],
        id: 'custom-ig-spot-1',
        name: 'Bambino Clubhouse Cafe',
        sourceHandle: '@518familyfun',
        sourceUrl: 'https://www.instagram.com/p/custom1/',
        isToddlerFriendly: true,
        isYoungKidFriendly: true,
      };
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const html = renderToStaticMarkup(
        <SpotCard
          spot={customSpot}
          userLocation={DEFAULT_CLIFTON_PARK_COORDS}
          isCustom={true}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );

      expect(html).toContain('Bambino Clubhouse Cafe');
      expect(html).toContain('Custom');
      expect(html).toContain('Toddler Friendly');
      expect(html).toContain('Young Kids');
      expect(html).toContain('Stroller Friendly');
      expect(html).toContain('View Post (@518familyfun)');
      expect(html).toContain('mi');

      const tree = renderAndCaptureTree(SpotCard, {
        spot: customSpot,
        userLocation: DEFAULT_CLIFTON_PARK_COORDS,
        isCustom: true,
        onEdit,
        onDelete,
      });

      const editBtn = getElementByTestId(tree, `edit-spot-${customSpot.id}`);
      (editBtn.props.onClick as () => void)();
      expect(onEdit).toHaveBeenCalledWith(customSpot);

      const deleteBtn = getElementByTestId(
        tree,
        `delete-spot-${customSpot.id}`,
      );
      (deleteBtn.props.onClick as () => void)();
      expect(onDelete).toHaveBeenCalledWith(customSpot.id);
    });
  });

  describe('SpotList', () => {
    const customIgSpot: Spot = {
      ...SEED_SPOTS[0],
      id: 'custom-spot-ig-99',
      name: 'Little Sprouts Play Barn',
      category: 'indoor_play',
      sourceHandle: '@capitaldistrictmoms',
      sourceUrl: 'https://www.instagram.com/p/sprouts99/',
    };

    const seedWithoutIg: Spot = {
      ...SEED_SPOTS[1],
      sourceHandle: undefined,
      sourceUrl: undefined,
    };

    const malformedIgSpot: Spot = {
      ...SEED_SPOTS[2],
      id: 'custom-spot-bad-ig',
      sourceHandle: '@!!!',
      sourceUrl: 'javascript:alert(1)',
    };

    const testSpots: Spot[] = [customIgSpot, seedWithoutIg];

    it('accurately identifies custom spots, Instagram finds (rejecting unresolvable links), and filters managed spots', () => {
      expect(isCustomSpot(customIgSpot)).toBe(true);
      expect(isCustomSpot(SEED_SPOTS[0])).toBe(false);

      expect(hasInstagramSource(customIgSpot)).toBe(true);
      expect(hasInstagramSource(seedWithoutIg)).toBe(false);
      expect(hasInstagramSource(malformedIgSpot)).toBe(false);

      expect(
        filterManagedSpots([...testSpots, malformedIgSpot], {
          instagramOnly: true,
        }),
      ).toHaveLength(1);
      expect(filterManagedSpots(testSpots, { customOnly: true })).toHaveLength(
        1,
      );
      expect(
        filterManagedSpots(testSpots, { category: 'indoor_play' }),
      ).toHaveLength(1);
      expect(
        filterManagedSpots(testSpots, { searchQuery: 'Sprouts' }),
      ).toHaveLength(1);
    });

    it('renders SpotList controls, filter toggles, SpotCards, Add Spot CTA, and Reset to Default Seeds button', () => {
      const onAddSpot = vi.fn();
      const onEditSpot = vi.fn();
      const onDeleteSpot = vi.fn();
      const onResetSpots = vi.fn();

      const html = renderToStaticMarkup(
        <SpotList
          spots={testSpots}
          userLocation={DEFAULT_CLIFTON_PARK_COORDS}
          onAddSpot={onAddSpot}
          onEditSpot={onEditSpot}
          onDeleteSpot={onDeleteSpot}
          onResetSpots={onResetSpots}
        />,
      );

      expect(html).toContain('+ Add Spot / Instagram Find');
      expect(html).toContain('Reset to Default Seeds');
      expect(html).toContain('Instagram Finds Only');
      expect(html).toContain('Custom Spots Only');
      expect(html).toContain('Little Sprouts Play Barn');

      const tree = renderAndCaptureTree(SpotList, {
        spots: testSpots,
        userLocation: DEFAULT_CLIFTON_PARK_COORDS,
        onAddSpot,
        onEditSpot,
        onDeleteSpot,
        onResetSpots,
      });

      const addBtn = getElementByTestId(tree, 'add-spot-cta-button');
      (addBtn.props.onClick as () => void)();
      expect(onAddSpot).toHaveBeenCalledTimes(1);

      const resetBtn = getElementByTestId(tree, 'reset-seed-spots-button');
      (resetBtn.props.onClick as () => void)();
      expect(onResetSpots).toHaveBeenCalledTimes(1);
    });
  });

  describe('App Tab Integration', () => {
    it('renders NearbyFeedView on the nearby tab and SpotList on both manage and spots tabs', () => {
      const nearbyHtml = renderToStaticMarkup(<App initialTab="nearby" />);
      expect(nearbyHtml).toContain('nearby-feed-view');
      expect(nearbyHtml).toContain('Request Coverage for My City');

      const manageHtml = renderToStaticMarkup(<App initialTab="manage" />);
      expect(manageHtml).toContain('manage-spots-view');
      expect(manageHtml).toContain('+ Add Spot / Instagram Find');
      expect(manageHtml).toContain('Instagram Finds Only');
      expect(manageHtml).toContain('Custom Spots Only');

      const spotsAliasHtml = renderToStaticMarkup(<App initialTab="spots" />);
      expect(spotsAliasHtml).toContain('manage-spots-view');
      expect(spotsAliasHtml).toContain('+ Add Spot / Instagram Find');
    });
  });
});

function renderAndCaptureTree<P extends object>(
  Component: React.FC<P>,
  props: P,
): unknown {
  let captured: unknown = null;
  const Wrapper: React.FC = () => {
    const element = Component(props);
    captured = element;
    return element;
  };
  renderToStaticMarkup(<Wrapper />);
  return captured;
}

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
  const element = node as {
    type?: unknown;
    props?: Record<string, unknown>;
  };
  if (element.props) {
    if (element.props['data-testid'] === testId) {
      return element as { props: Record<string, unknown> };
    }
    if (element.props.children) {
      const childFound = findElementByTestId(element.props.children, testId);
      if (childFound) return childFound;
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

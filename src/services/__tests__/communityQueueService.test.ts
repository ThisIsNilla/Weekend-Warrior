import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCoverageRequests,
  getCoverageRequests,
  isCommunityCoverageRequest,
  normalizeInstagramHandles,
  submitCoverageRequest,
} from '../communityQueueService';

describe('communityQueueService', () => {
  beforeEach(() => {
    clearCoverageRequests();
  });

  it('returns an empty array when no coverage requests have been submitted', () => {
    expect(getCoverageRequests()).toEqual([]);
  });

  it('normalizes Instagram handles from string, array, or pasted profile URLs and deduplicates case-insensitively', () => {
    expect(
      normalizeInstagramHandles(
        '@capitaldistrictmoms, 518kids; @@SaratogaMoms\n@CAPITALDISTRICTMOMS',
      ),
    ).toEqual(['@capitaldistrictmoms', '@518kids', '@SaratogaMoms']);

    expect(
      normalizeInstagramHandles([
        '@albanykids',
        '  troyfamily ',
        '@ALBANYKIDS',
        'https://www.instagram.com/upstateparent/?igsh=123',
        'instagram.com/schenectadymoms/',
        'https://www.instagram.com/p/post123/',
        '...',
      ]),
    ).toEqual([
      '@albanykids',
      '@troyfamily',
      '@upstateparent',
      '@schenectadymoms',
    ]);

    expect(normalizeInstagramHandles('')).toEqual([]);
    expect(normalizeInstagramHandles(undefined)).toEqual([]);
  });

  it('submits and persists valid city coverage requests with Supabase-ready structure', () => {
    const first = submitCoverageRequest({
      cityName: '  Burlington ',
      stateOrZip: ' VT ',
      suggestedInstagramHandles: '@burlingtonvt_moms, vermontkids',
      parentNotes: '  Love Echo Leahy Center and waterfront parks! ',
    });

    expect(first.id).toMatch(/^cov-/);
    expect(first.cityName).toBe('Burlington');
    expect(first.stateOrZip).toBe('VT');
    expect(first.suggestedInstagramHandles).toEqual([
      '@burlingtonvt_moms',
      '@vermontkids',
    ]);
    expect(first.parentNotes).toBe(
      'Love Echo Leahy Center and waterfront parks!',
    );
    expect(first.status).toBe('pending');
    expect(typeof first.createdAt).toBe('string');
    expect(isCommunityCoverageRequest(first)).toBe(true);

    const second = submitCoverageRequest({
      cityName: 'Raleigh',
      stateOrZip: '27601',
    });

    expect(second.cityName).toBe('Raleigh');
    expect(second.stateOrZip).toBe('27601');
    expect(second.suggestedInstagramHandles).toEqual([]);
    expect(second.parentNotes).toBeUndefined();

    const stored = getCoverageRequests();
    expect(stored).toHaveLength(2);
    expect(stored[0].cityName).toBe('Burlington');
    expect(stored[1].cityName).toBe('Raleigh');
  });

  it('throws validation errors when cityName or stateOrZip is missing or blank', () => {
    expect(() =>
      submitCoverageRequest({
        cityName: '   ',
        stateOrZip: 'NY',
      }),
    ).toThrow('City or town name is required');

    expect(() =>
      submitCoverageRequest({
        cityName: 'Saratoga Springs',
        stateOrZip: '  ',
      }),
    ).toThrow('State or ZIP code is required');

    expect(getCoverageRequests()).toEqual([]);
  });

  it('clears all stored coverage requests via clearCoverageRequests', () => {
    submitCoverageRequest({
      cityName: 'Austin',
      stateOrZip: 'TX',
    });
    expect(getCoverageRequests()).toHaveLength(1);

    clearCoverageRequests();
    expect(getCoverageRequests()).toEqual([]);
  });

  it('validates objects accurately with isCommunityCoverageRequest', () => {
    expect(isCommunityCoverageRequest(null)).toBe(false);
    expect(isCommunityCoverageRequest({})).toBe(false);
    expect(
      isCommunityCoverageRequest({
        id: 'cov-1',
        cityName: 'Albany',
        stateOrZip: 'NY',
        suggestedInstagramHandles: ['@albanymoms'],
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
    ).toBe(true);
    expect(
      isCommunityCoverageRequest({
        id: 'cov-2',
        cityName: 'Albany',
        stateOrZip: 'NY',
        suggestedInstagramHandles: ['@albanymoms'],
        status: 'invalid_status',
        createdAt: new Date().toISOString(),
      }),
    ).toBe(false);
  });
});

import { useCallback, useState } from 'react';
import type { Spot } from '../types';
import {
  addSpot as storageAddSpot,
  deleteSpot as storageDeleteSpot,
  getAllSpots,
  resetToDefaultSeeds,
  updateSpot as storageUpdateSpot,
} from '../storage/spotsStorage';

export interface UseSpotsReturn {
  spots: Spot[];
  error: string | null;
  addSpot: (spot: Spot) => Spot;
  updateSpot: (spot: Spot) => Spot;
  deleteSpot: (id: string) => boolean;
  resetSpots: () => Spot[];
  refreshSpots: () => Spot[];
}

/**
 * Custom hook managing the saved spots list synced with spotsStorage CRUD operations.
 */
export function useSpots(): UseSpotsReturn {
  const [spots, setSpots] = useState<Spot[]>(() => getAllSpots());
  const [error, setError] = useState<string | null>(null);

  const refreshSpots = useCallback((): Spot[] => {
    const current = getAllSpots();
    setSpots(current);
    setError(null);
    return current;
  }, []);

  const addSpot = useCallback((spot: Spot): Spot => {
    try {
      const created = storageAddSpot(spot);
      setSpots(getAllSpots());
      setError(null);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add spot';
      setError(message);
      throw err;
    }
  }, []);

  const updateSpot = useCallback((spot: Spot): Spot => {
    try {
      const updated = storageUpdateSpot(spot);
      setSpots(getAllSpots());
      setError(null);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update spot';
      setError(message);
      throw err;
    }
  }, []);

  const deleteSpot = useCallback((id: string): boolean => {
    try {
      const deleted = storageDeleteSpot(id);
      setSpots(getAllSpots());
      setError(null);
      return deleted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete spot';
      setError(message);
      return false;
    }
  }, []);

  const resetSpots = useCallback((): Spot[] => {
    const seeds = resetToDefaultSeeds();
    setSpots(seeds);
    setError(null);
    return seeds;
  }, []);

  return {
    spots,
    error,
    addSpot,
    updateSpot,
    deleteSpot,
    resetSpots,
    refreshSpots,
  };
}

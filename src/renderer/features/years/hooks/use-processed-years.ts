import { useMemo } from 'react';

import { YEAR_PLAYLISTS, YearPlaylist } from '../years-playlists';
import { useOptimizedYearAlbumCounts } from './use-optimized-year-album-counts';
import { useYearAlbumCounts } from './use-year-album-counts';

import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { SortOrder } from '/@/shared/types/domain-types';

interface ProcessedYearsResult {
    allYears: YearPlaylist[];
    filteredYears: YearPlaylist[];
    getAlbumsForYear: (yearId: string, limit?: number) => any[];
    isError: boolean;
    isLoading: boolean;
    sortedFilteredYears: YearPlaylist[];
}

/**
 * Centralized hook that combines optimized data fetching with processing logic
 * Eliminates redundant filtering/sorting across multiple components
 */
export const useProcessedYears = (searchTerm = ''): ProcessedYearsResult => {
    const { customFilters, pageKey } = useListContext();
    const { filter } = useListStoreByKey<any>({
        filter: customFilters,
        key: pageKey,
    });

    // Try optimized data fetching first
    const optimizedResult = useOptimizedYearAlbumCounts(YEAR_PLAYLISTS);

    // Temporarily force fallback to debug the optimized version
    const shouldUseFallback = true; // !optimizedResult.isLoading && optimizedResult.yearsWithAlbums.length === 0;
    const fallbackResult = useYearAlbumCounts(YEAR_PLAYLISTS);

    // Choose which result to use
    const { getAlbumsForYear, isError, isLoading, yearsWithAlbums } = shouldUseFallback
        ? {
              getAlbumsForYear: () => [], // No pre-fetched albums in fallback
              isError: fallbackResult.isError,
              isLoading: fallbackResult.isLoading,
              yearsWithAlbums: fallbackResult.yearsWithAlbums,
          }
        : optimizedResult;

    // Extract filter values with defaults
    const typeFilter = ((filter as any)?._custom as any)?.typeFilter || 'all';
    const sortBy = (filter as any)?.sortBy || 'year';
    const sortOrderValue = (filter as any)?.sortOrder || SortOrder.DESC;

    // Ensure sortOrder is properly converted to enum value
    const sortOrder =
        sortOrderValue === SortOrder.ASC || sortOrderValue === 'asc'
            ? SortOrder.ASC
            : SortOrder.DESC;

    // Apply type filter
    const filteredByType = useMemo(() => {
        if (typeFilter === 'decades') {
            return yearsWithAlbums.filter((year) => year.type === 'decade');
        } else if (typeFilter === 'years') {
            return yearsWithAlbums.filter((year) => year.type === 'year');
        }
        return yearsWithAlbums;
    }, [yearsWithAlbums, typeFilter]);

    // Apply sorting
    const sortedYears = useMemo(() => {
        const sorted = [...filteredByType].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'albumCount':
                    aValue = a.albumCount || 0;
                    bValue = b.albumCount || 0;
                    break;
                case 'year':
                default:
                    // For decades, use the start year (e.g., 1980 for "1980s")
                    aValue =
                        a.type === 'decade' ? parseInt(a.displayName) : parseInt(a.displayName);
                    bValue =
                        b.type === 'decade' ? parseInt(b.displayName) : parseInt(b.displayName);
                    break;
            }

            if (aValue < bValue) {
                return sortOrder === SortOrder.ASC ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortOrder === SortOrder.ASC ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [filteredByType, sortBy, sortOrder]);

    // Apply search filter
    const searchFilteredYears = useMemo(() => {
        if (!searchTerm) return sortedYears;

        return sortedYears.filter((year) =>
            year.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [sortedYears, searchTerm]);

    return {
        allYears: yearsWithAlbums,
        filteredYears: filteredByType,
        getAlbumsForYear,
        isError,
        isLoading,
        sortedFilteredYears: searchFilteredYears,
    };
};

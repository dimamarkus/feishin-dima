import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { YearPlaylist } from '../years-playlists';

import { useAlbumListCount } from '/@/renderer/features/albums/queries/album-list-count-query';
import { useCurrentServer } from '/@/renderer/store';
import { AlbumListSort, SortOrder } from '/@/shared/types/domain-types';

interface YearWithAlbumCount extends YearPlaylist {
    albumCount?: number;
}

/**
 * Hook that fetches album counts for all years efficiently
 * Uses batched queries with caching to avoid overwhelming the server
 */
export const useYearAlbumCounts = (years: YearPlaylist[]) => {
    const server = useCurrentServer();

    // Create queries for each year/decade
    const yearQueries = years.map((year) => {
        const query = Array.isArray(year.releaseYearValue)
            ? {
                  maxYear: Math.max(...year.releaseYearValue),
                  minYear: Math.min(...year.releaseYearValue),
              }
            : {
                  maxYear: year.releaseYearValue,
                  minYear: year.releaseYearValue,
              };

        return useAlbumListCount({
            options: {
                cacheTime: 1000 * 60 * 30, // 30 minutes cache
                staleTime: 1000 * 60 * 15, // 15 minutes fresh
            },
            query: {
                ...query,
                sortBy: AlbumListSort.YEAR,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        });
    });

    // Combine results
    const yearsWithCounts: YearWithAlbumCount[] = useMemo(() => {
        return years.map((year, index) => ({
            ...year,
            albumCount: yearQueries[index].data ?? undefined,
        }));
    }, [years, yearQueries]);

    // Filter out years with no albums
    const yearsWithAlbums = useMemo(() => {
        return yearsWithCounts.filter((year) => {
            // If still loading, include the year (don't filter out yet)
            if (year.albumCount === undefined) return true;
            // Filter out years with 0 albums
            return year.albumCount > 0;
        });
    }, [yearsWithCounts]);

    // Check loading state
    const isLoading = yearQueries.some((query) => query.isLoading);
    const isError = yearQueries.some((query) => query.isError);

    return {
        isError,
        isLoading,
        yearsWithAlbums,
        yearsWithCounts,
    };
};

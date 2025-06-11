import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { YearPlaylist } from '../years-playlists';

import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { Album, AlbumListSort, SortOrder } from '/@/shared/types/domain-types';

interface YearAlbumCounts {
    [yearId: string]: {
        albums: Album[];
        count: number;
    };
}

interface YearWithAlbumCount extends YearPlaylist {
    albumCount?: number;
}

/**
 * Optimized hook that fetches all albums in one request and processes counts client-side
 * Reduces 85+ API calls to just 1-2 calls with aggressive caching
 */
export const useOptimizedYearAlbumCounts = (years: YearPlaylist[]) => {
    const server = useCurrentServer();
    const currentYear = new Date().getFullYear();

    // Single query to fetch all albums from 1950 to current year + 1
    const allAlbumsQuery = useAlbumList({
        options: {
            cacheTime: 1000 * 60 * 60 * 2, // 2 hours cache - very aggressive since year data is relatively stable
            refetchOnWindowFocus: false, // Don't refetch on focus
            staleTime: 1000 * 60 * 30, // 30 minutes fresh
        },
        query: {
            limit: 5000, // Reduced limit to avoid potential server issues
            maxYear: currentYear + 1,
            minYear: 1950,
            sortBy: AlbumListSort.YEAR,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    // Debug logging
    console.log('🔍 Debug - useOptimizedYearAlbumCounts:', {
        albumCount: allAlbumsQuery.data?.items?.length || 0,
        error: allAlbumsQuery.error,
        isError: allAlbumsQuery.isError,
        isLoading: allAlbumsQuery.isLoading,
        queryParams: {
            limit: 5000,
            maxYear: currentYear + 1,
            minYear: 1950,
            sortBy: AlbumListSort.YEAR,
            sortOrder: SortOrder.ASC,
        },
        sampleAlbums:
            allAlbumsQuery.data?.items
                ?.slice(0, 3)
                .map((a) => ({ name: a.name, releaseYear: a.releaseYear })) || [],
        server: server?.id,
        totalRecordCount: allAlbumsQuery.data?.totalRecordCount,
        yearCount: years.length,
    });

    // Process albums to generate year counts
    const { albumsByYear, yearCounts } = useMemo(() => {
        const albums = allAlbumsQuery.data?.items || [];
        const counts: YearAlbumCounts = {};
        const albumsMap: { [yearId: string]: Album[] } = {};

        console.log('🔍 Processing albums:', albums.length);

        // Initialize all years with 0 count
        years.forEach((year) => {
            counts[year.id] = { albums: [], count: 0 };
            albumsMap[year.id] = [];
        });

        // Process each album and assign to appropriate years/decades
        albums.forEach((album) => {
            if (!album.releaseYear) {
                console.log('⚠️ Album without releaseYear:', album.name);
                return;
            }

            const albumYear = album.releaseYear;

            // Find matching years and decades for this album
            years.forEach((yearPlaylist) => {
                let matches = false;

                if (yearPlaylist.type === 'year') {
                    // Individual year match
                    matches = albumYear === yearPlaylist.releaseYearValue;
                } else if (
                    yearPlaylist.type === 'decade' &&
                    Array.isArray(yearPlaylist.releaseYearValue)
                ) {
                    // Decade range match
                    matches = yearPlaylist.releaseYearValue.includes(albumYear);
                }

                if (matches) {
                    counts[yearPlaylist.id].count++;
                    albumsMap[yearPlaylist.id].push(album);
                }
            });
        });

        // Update counts with albums
        Object.keys(counts).forEach((yearId) => {
            counts[yearId].albums = albumsMap[yearId];
        });

        // Debug year counts
        const nonZeroCounts = Object.entries(counts).filter(([_, data]) => data.count > 0);
        console.log('🔍 Year counts (non-zero):', nonZeroCounts.slice(0, 10));

        return { albumsByYear: albumsMap, yearCounts: counts };
    }, [allAlbumsQuery.data?.items, years]);

    // Convert to the format expected by existing components
    const yearsWithCounts: YearWithAlbumCount[] = useMemo(() => {
        return years.map((year) => ({
            ...year,
            albumCount: yearCounts[year.id]?.count ?? undefined,
        }));
    }, [years, yearCounts]);

    // Filter out years with no albums (but keep them if still loading)
    const yearsWithAlbums = useMemo(() => {
        const filtered = yearsWithCounts.filter((year) => {
            // If still loading, include the year (don't filter out yet)
            if (year.albumCount === undefined) return true;
            // Filter out years with 0 albums
            return year.albumCount > 0;
        });

        console.log('🔍 Years with albums:', filtered.length, 'out of', yearsWithCounts.length);
        console.log(
            '🔍 Sample years with albums:',
            filtered.slice(0, 5).map((y) => ({ count: y.albumCount, name: y.displayName })),
        );

        return filtered;
    }, [yearsWithCounts]);

    // Get albums for a specific year (for mosaic generation)
    const getAlbumsForYear = useMemo(() => {
        return (yearId: string, limit = 20): Album[] => {
            const yearAlbums = albumsByYear[yearId] || [];
            // Shuffle albums for random mosaic selection
            const shuffled = [...yearAlbums].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, limit);
        };
    }, [albumsByYear]);

    return {
        albumsByYear,
        getAlbumsForYear,
        isError: allAlbumsQuery.isError,
        isLoading: allAlbumsQuery.isLoading,
        yearsWithAlbums,
        yearsWithCounts,
    };
};

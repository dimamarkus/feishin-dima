import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { YearPlaylist } from '../years-playlists';

import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { Album, AlbumListSort, Song, SongListSort, SortOrder } from '/@/shared/types/domain-types';

export interface YearAlbumCounts {
    [yearId: string]: {
        albums: Album[];
        count: number;
    };
}

interface YearWithAlbumCount extends YearPlaylist {
    albumCount?: number;
}

/**
 * Optimized hook that fetches all albums and songs in one request each and processes counts client-side
 * Analyzes actual song years to ensure albums only appear in years where they have songs
 * Reduces 85+ API calls to just 2 calls with aggressive caching
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

    // Single query to fetch all songs from 1950 to current year + 1
    const allSongsQuery = useSongList({
        options: {
            cacheTime: 1000 * 60 * 60 * 2, // 2 hours cache - very aggressive
            refetchOnWindowFocus: false, // Don't refetch on focus
            staleTime: 1000 * 60 * 30, // 30 minutes fresh
        },
        query: {
            limit: 20000, // Increased limit to ensure we get all songs
            maxYear: currentYear + 1,
            minYear: 1950,
            sortBy: SongListSort.YEAR,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    // Process songs to determine the latest year for each album
    const albumLatestYears = useMemo((): {
        [albumId: string]: { album: Album; latestYear: number };
    } => {
        const albums = allAlbumsQuery.data?.items || [];
        const songs = allSongsQuery.data?.items || [];
        const result: { [albumId: string]: { album: Album; latestYear: number } } = {};

        // Debug logging
        console.log('🎵 Simplified song-based processing:', {
            albumCount: albums.length,
            songCount: songs.length,
        });

        // Initialize album data with their release year as fallback
        albums.forEach((album) => {
            result[album.id] = {
                album,
                latestYear: album.releaseYear || 0,
            };
        });

        // Find the latest year for each album based on its songs
        songs.forEach((song) => {
            if (!song.albumId || !song.releaseYear) return;

            // Convert song.releaseYear from string to number
            const songYear = parseInt(song.releaseYear, 10);
            if (isNaN(songYear)) return;

            const albumData = result[song.albumId];
            if (albumData) {
                // Update to the latest year found in the album's songs
                albumData.latestYear = Math.max(albumData.latestYear, songYear);
            }
        });

        // Debug: Show some examples
        const exampleAlbums = Object.values(result).slice(0, 5);
        console.log(
            '📅 Album latest years (examples):',
            exampleAlbums.map((data) => ({
                albumName: data.album.name,
                albumReleaseYear: data.album.releaseYear,
                latestSongYear: data.latestYear,
            })),
        );

        return result;
    }, [allAlbumsQuery.data?.items, allSongsQuery.data?.items]);

    // Process albums to generate year counts based on latest year only
    const { albumsByYear, yearCounts } = useMemo(() => {
        const counts: YearAlbumCounts = {};
        const albumsMap: { [yearId: string]: Album[] } = {};

        // Initialize all years with 0 count
        years.forEach((year) => {
            counts[year.id] = { albums: [], count: 0 };
            albumsMap[year.id] = [];
        });

        // Process each album - assign to only its latest year
        Object.values(albumLatestYears).forEach(({ album, latestYear }) => {
            // Skip albums with no valid year
            if (!latestYear || latestYear === 0) return;

            // Find the matching year/decade for this album's latest year
            years.forEach((yearPlaylist) => {
                let matches = false;

                if (yearPlaylist.type === 'year') {
                    // Individual year match
                    matches = latestYear === yearPlaylist.releaseYearValue;
                } else if (
                    yearPlaylist.type === 'decade' &&
                    Array.isArray(yearPlaylist.releaseYearValue)
                ) {
                    // Decade range match
                    matches = yearPlaylist.releaseYearValue.includes(latestYear);
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

        return { albumsByYear: albumsMap, yearCounts: counts };
    }, [albumLatestYears, years]);

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
        isError: allAlbumsQuery.isError || allSongsQuery.isError,
        isLoading: allAlbumsQuery.isLoading || allSongsQuery.isLoading,
        yearsWithAlbums,
        yearsWithCounts,
    };
};

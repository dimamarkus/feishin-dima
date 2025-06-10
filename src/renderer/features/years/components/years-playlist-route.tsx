import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { YEAR_PLAYLISTS } from '../years-playlists';
import { YearDetailHeader } from './year-detail-header';
import { YearAlbumListFilters } from './year-album-list-filters';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumListCount } from '/@/renderer/features/albums/queries/album-list-count-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage, FilterBar } from '/@/renderer/features/shared';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const YearsPlaylistRoute = () => {
    const { yearId } = useParams() as { yearId: string };
    const server = useCurrentServer();
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);

    // Find the year playlist configuration
    const yearPlaylist = YEAR_PLAYLISTS.find((playlist) => {
        const id = playlist.id.replace('year-', '');
        return id === yearId;
    });

    const handlePlayQueueAdd = usePlayQueueAdd();

    // Use 'album' as the pageKey since we're displaying albums
    const pageKey = 'album';

    // Use the same pattern as album list route with custom filters
    const customFilters = useMemo(() => {
        if (!yearPlaylist?.releaseYearValue) return undefined;

        if (Array.isArray(yearPlaylist.releaseYearValue)) {
            // For decades with multiple years, filter by year range
            const years = yearPlaylist.releaseYearValue;
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);

            return {
                maxYear,
                minYear,
            };
        } else {
            // For individual years, use the same year for both min and max to filter by specific year
            return {
                maxYear: yearPlaylist.releaseYearValue,
                minYear: yearPlaylist.releaseYearValue,
            };
        }
    }, [yearPlaylist?.releaseYearValue]);

    // Use useListFilterByKey with the existing 'album' key
    const albumListFilter = useListFilterByKey<AlbumListQuery>({
        filter: {
            ...customFilters,
            sortBy: AlbumListSort.YEAR,
            sortOrder: SortOrder.ASC,
        },
        key: pageKey,
    });

    const itemCountCheck = useAlbumListCount({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: albumListFilter,
        serverId: server?.id,
    });

    // Fetch albums for metadata calculation
    const albumsQuery = useAlbumList({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: { ...albumListFilter, limit: 50 }, // Limit for performance, just for metadata
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { initialSongId, playType } = args;
            const query: AlbumListQuery = { ...albumListFilter, limit: itemCount, startIndex: 0 };

            handlePlayQueueAdd?.({
                byItemType: {
                    id: [],
                    type: LibraryItem.ALBUM,
                },
                initialSongId,
                playType,
                query,
            });
        },
        [handlePlayQueueAdd, itemCount, albumListFilter],
    );

    const providerValue = useMemo(() => {
        return {
            customFilters,
            handlePlay,
            id: yearId,
            pageKey,
        };
    }, [customFilters, handlePlay, yearId, pageKey]);

    if (!yearPlaylist) {
        return (
            <AnimatedPage>
                <div>Year not found</div>
            </AnimatedPage>
        );
    }

    return (
        <AnimatedPage key={`year-playlist-${yearId}`}>
            <ListContext.Provider value={providerValue}>
                <YearDetailHeader
                    albumCount={itemCount}
                    albums={albumsQuery.data?.items || []}
                    yearValue={yearPlaylist.displayName}
                />
                <FilterBar>
                    <YearAlbumListFilters
                        albums={albumsQuery.data?.items || []}
                        gridRef={gridRef}
                        itemCount={itemCount}
                        tableRef={tableRef}
                    />
                </FilterBar>
                <AlbumListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

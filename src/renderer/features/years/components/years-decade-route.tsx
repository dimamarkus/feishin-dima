import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { YEAR_DECADES } from '../years-playlists';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { useAlbumListCount } from '/@/renderer/features/albums/queries/album-list-count-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const YearsDecadeRoute = () => {
    const { decadeId } = useParams() as { decadeId: string };
    const server = useCurrentServer();
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);

    // Find the decade playlist configuration
    const decadePlaylist = YEAR_DECADES.find((playlist) => {
        const id = playlist.id.replace('year-', '');
        return id === decadeId;
    });

    const handlePlayQueueAdd = usePlayQueueAdd();

    // Use 'album' as the pageKey since we're displaying albums
    const pageKey = 'album';

    // Use the same pattern as album list route with custom filters
    const customFilters = useMemo(() => {
        if (!decadePlaylist?.releaseYearValue || !Array.isArray(decadePlaylist.releaseYearValue)) {
            return undefined;
        }

        // For decades with multiple years, filter by year range
        const years = decadePlaylist.releaseYearValue;
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        return {
            maxYear,
            minYear,
        };
    }, [decadePlaylist?.releaseYearValue]);

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
            id: decadeId,
            pageKey,
        };
    }, [customFilters, handlePlay, decadeId, pageKey]);

    if (!decadePlaylist) {
        return (
            <AnimatedPage>
                <div>Decade not found</div>
            </AnimatedPage>
        );
    }

    const title = `${decadePlaylist.icon} ${decadePlaylist.displayName} Albums`;

    return (
        <AnimatedPage key={`decade-playlist-${decadeId}`}>
            <ListContext.Provider value={providerValue}>
                <AlbumListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={title}
                />
                <AlbumListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

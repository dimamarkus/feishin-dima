import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { TIME_PLAYLISTS } from '../time-playlists';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongListCount } from '/@/renderer/features/songs/queries/song-list-count-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const TimePlaylistRoute = () => {
    const { t } = useTranslation();
    const { timeId } = useParams() as { timeId: string };
    const server = useCurrentServer();
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);

    // Find the time playlist configuration
    const timePlaylist = TIME_PLAYLISTS.find((playlist) => {
        const id = playlist.id.replace('time-', '');
        return id === timeId;
    });

    const handlePlayQueueAdd = usePlayQueueAdd();

    // Use 'song' as the pageKey since it's a predefined key in the store
    const pageKey = 'song';

    // Use the same pattern as song list route with custom filters
    const customFilters = useMemo(() => {
        return {
            searchTerm: timePlaylist?.lyricistValue || '',
        };
    }, [timePlaylist?.lyricistValue]);

    // Use useListFilterByKey with the existing 'song' key
    const songListFilter = useListFilterByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const itemCountCheck = useSongListCount({
        options: {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
        query: songListFilter,
        serverId: server?.id,
    });

    const itemCount = itemCountCheck.data === null ? undefined : itemCountCheck.data;

    const handlePlay = useCallback(
        async (args: { initialSongId?: string; playType: Play }) => {
            if (!itemCount || itemCount === 0) return;
            const { initialSongId, playType } = args;
            const query: SongListQuery = { ...songListFilter, limit: itemCount, startIndex: 0 };

            handlePlayQueueAdd?.({
                byItemType: {
                    id: [],
                    type: LibraryItem.SONG,
                },
                initialSongId,
                playType,
                query,
            });
        },
        [handlePlayQueueAdd, itemCount, songListFilter],
    );

    const providerValue = useMemo(() => {
        return {
            customFilters,
            handlePlay,
            id: timeId,
            pageKey,
        };
    }, [customFilters, handlePlay, timeId, pageKey]);

    if (!timePlaylist) {
        return (
            <AnimatedPage>
                <div>Time period not found</div>
            </AnimatedPage>
        );
    }

    const title = `${timePlaylist.icon} ${timePlaylist.displayName}`;

    return (
        <AnimatedPage key={`time-playlist-${timeId}`}>
            <ListContext.Provider value={providerValue}>
                <SongListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                    title={title}
                />
                <SongListContent
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

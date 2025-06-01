import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useSongListCount } from '/@/renderer/features/songs/queries/song-list-count-query';
import { useCurrentServer, useListFilterByKey } from '/@/renderer/store';
import { LibraryItem, SongListQuery } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Helper function to convert 24-hour to 12-hour with am/pm
const formatTimeForLyricist = (hour24: number): string => {
    if (hour24 === 0) return '12am';
    if (hour24 < 12) return `${hour24}am`;
    if (hour24 === 12) return '12pm';
    return `${hour24 - 12}pm`;
};

// Helper function to get the display format for the time range
const formatTimeRangeDisplay = (startHour: number, endHour: number, period: string): string => {
    const formatHour = (hour: number): string => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };

    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
};

export const TimeRangePlaylistRoute = () => {
    const { t } = useTranslation();
    const { period, timeRangeId } = useParams() as { period: string; timeRangeId: string };
    const server = useCurrentServer();
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);

    // Parse the time range (e.g., "15-16" -> start: 15, end: 16)
    const [startHour, endHour] = timeRangeId.split('-').map(Number);

    // Generate lyricist values for the time range
    const lyricistValues = useMemo(() => {
        const values: string[] = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            values.push(formatTimeForLyricist(hour));
        }
        return values;
    }, [startHour, endHour]);

    const handlePlayQueueAdd = usePlayQueueAdd();

    // Use 'song' as the pageKey since it's a predefined key in the store
    const pageKey = 'song';

    // Use the same pattern as time periods with multiple lyricist values
    const customFilters = useMemo(() => {
        if (lyricistValues.length === 0) return undefined;

        // Use the first value as the primary search term
        // This matches the pattern used in TIME_PERIODS
        return {
            searchTerm: lyricistValues[0],
        };
    }, [lyricistValues]);

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
            id: timeRangeId,
            pageKey,
        };
    }, [customFilters, handlePlay, timeRangeId, pageKey]);

    if (!timeRangeId || !period || isNaN(startHour) || isNaN(endHour)) {
        return (
            <AnimatedPage>
                <div>Invalid time range</div>
            </AnimatedPage>
        );
    }

    // Create a title with appropriate icon and formatting
    const icon = period === 'am' ? '🌅' : '🌆';
    const timeDisplay = formatTimeRangeDisplay(startHour, endHour, period);
    const title = `${icon} ${timeDisplay}`;

    return (
        <AnimatedPage key={`time-range-playlist-${timeRangeId}-${period}`}>
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

export default TimeRangePlaylistRoute;

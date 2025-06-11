import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';

import { useYearAlbumCounts } from '../hooks/use-year-album-counts';
import { YEAR_PLAYLISTS } from '../years-playlists';

import { YEAR_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
    VirtualInfiniteGridRef,
} from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

interface YearsListGridViewProps {
    gridRef: React.MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
}

export const YearsListGridView = ({ gridRef, itemCount }: YearsListGridViewProps) => {
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { id, pageKey } = useListContext();
    const { display, grid } = useListStoreByKey({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    // Get years with album counts
    const { isLoading, yearsWithAlbums } = useYearAlbumCounts(YEAR_PLAYLISTS);

    const cardRows = useMemo(() => {
        const rows = [YEAR_CARD_ROWS.name, YEAR_CARD_ROWS.albumCount];
        return rows;
    }, []);

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            if (id) {
                setSearchParams(
                    (params) => {
                        params.set('scrollOffset', String(e.scrollOffset));
                        return params;
                    },
                    { replace: true },
                );
            } else {
                setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
            }
        },
        [id, pageKey, setGrid, setSearchParams],
    );

    const fetchInitialData = useCallback(() => {
        // Transform years to match the expected format
        return yearsWithAlbums.map((year) => ({
            ...year,
            id: year.id,
            imageUrl: 'mosaic://year-albums', // Use special URL for year mosaics
            itemType: LibraryItem.GENRE, // Use GENRE as placeholder
            name: year.displayName,
        })) as any;
    }, [yearsWithAlbums]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            // Transform years and slice for pagination
            const transformedYears = yearsWithAlbums.map((year) => ({
                ...year,
                id: year.id,
                imageUrl: 'mosaic://year-albums',
                itemType: LibraryItem.GENRE,
                name: year.displayName,
            }));

            const items = transformedYears.slice(skip, skip + take);
            return {
                items,
                startIndex: skip,
                totalRecordCount: yearsWithAlbums.length,
            };
        },
        [yearsWithAlbums],
    );

    const route = {
        route: AppRoute.LIBRARY_YEARS_DETAIL,
        slugs: [{ idProperty: 'displayName', slugProperty: 'yearId' }],
    };

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        cardRows={cardRows}
                        display={display || ListDisplayType.CARD}
                        fetchFn={fetch}
                        fetchInitialData={fetchInitialData}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        height={height}
                        initialScrollOffset={initialScrollOffset}
                        itemCount={yearsWithAlbums.length}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.GENRE}
                        key={`years-list-${server?.id}-${display}`}
                        loading={isLoading}
                        minimumBatchSize={40}
                        onScroll={handleGridScroll}
                        ref={gridRef}
                        route={route}
                        width={width}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};

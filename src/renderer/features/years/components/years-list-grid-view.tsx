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
import { LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

interface YearsListGridViewProps {
    gridRef: React.MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
}

export const YearsListGridView = ({ gridRef, itemCount }: YearsListGridViewProps) => {
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { id, pageKey } = useListContext();
    const { display, filter, grid } = useListStoreByKey({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    // Get years with album counts
    const { isLoading, yearsWithAlbums } = useYearAlbumCounts(YEAR_PLAYLISTS);

    // Apply type filter
    const typeFilter = ((filter as any)?._custom as any)?.typeFilter || 'all';
    const filteredYears = useMemo(() => {
        if (typeFilter === 'decades') {
            return yearsWithAlbums.filter((year) => year.type === 'decade');
        } else if (typeFilter === 'years') {
            return yearsWithAlbums.filter((year) => year.type === 'year');
        }
        return yearsWithAlbums;
    }, [yearsWithAlbums, typeFilter]);

    // Apply sorting
    const sortBy = (filter as any)?.sortBy || 'year';
    const sortOrderValue = (filter as any)?.sortOrder || SortOrder.DESC;

    // Ensure sortOrder is properly converted to enum value
    const sortOrder =
        sortOrderValue === SortOrder.ASC || sortOrderValue === 'asc'
            ? SortOrder.ASC
            : SortOrder.DESC;

    const sortedAndFilteredYears = useMemo(() => {
        const sorted = [...filteredYears].sort((a, b) => {
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
    }, [filteredYears, sortBy, sortOrder]);

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
        return sortedAndFilteredYears.map((year) => ({
            ...year,
            id: year.id,
            imageUrl: 'mosaic://year-albums', // Use special URL for year mosaics
            itemType: LibraryItem.GENRE, // Use GENRE as placeholder
            name: year.displayName,
            // Add type for visual badge
            yearType: year.type,
        })) as any;
    }, [sortedAndFilteredYears]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            // Transform years and slice for pagination
            const transformedYears = sortedAndFilteredYears.map((year) => ({
                ...year,
                id: year.id,
                imageUrl: 'mosaic://year-albums',
                itemType: LibraryItem.GENRE,
                name: year.displayName,
                yearType: year.type,
            }));

            const items = transformedYears.slice(skip, skip + take);
            return {
                items,
                startIndex: skip,
                totalRecordCount: sortedAndFilteredYears.length,
            };
        },
        [sortedAndFilteredYears],
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
                        itemCount={sortedAndFilteredYears.length}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.GENRE}
                        key={`years-list-${server?.id}-${display}-${typeFilter}-${sortBy}-${sortOrder}`}
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

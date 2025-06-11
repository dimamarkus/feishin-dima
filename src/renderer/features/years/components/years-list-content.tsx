import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useYearAlbumCounts } from '../hooks/use-year-album-counts';
import { YEAR_PLAYLISTS, YearPlaylist } from '../years-playlists';
import { YearAlbumMosaic } from './year-album-mosaic';
import { YearsListHeader } from './years-list-header';
import { YearsListTableView } from './years-list-table-view';

import { Spinner } from '/@/renderer/components';
import { Text } from '/@/renderer/components/text';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';
import { LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

const YearsListGridView = lazy(() =>
    import('/@/renderer/features/years/components/years-list-grid-view').then((module) => ({
        default: module.YearsListGridView,
    })),
);

type YearsListContentProps = {
    itemCount?: number;
};

const Container = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 20px;
    flex: 1;
    overflow-y: auto;
`;

const YearCard = styled.div`
    background: var(--card-default-bg);
    border-radius: var(--card-default-radius);
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s ease-in-out;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;

    &:hover {
        background: var(--card-default-bg-hover);
    }
`;

const YearInfo = styled.div`
    margin-top: 12px;
    text-align: center;
    width: 100%;
`;

export const YearsListContent = ({ itemCount }: YearsListContentProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const [searchTerm, setSearchTerm] = useState('');
    const { customFilters, pageKey } = useListContext();
    const { display, filter } = useListStoreByKey<any>({
        filter: customFilters,
        key: pageKey,
    });

    // Create refs for the header component
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<any>(null);

    // Get album counts for all years and filter out empty ones
    const { isLoading: countsLoading, yearsWithAlbums } = useYearAlbumCounts(YEAR_PLAYLISTS);

    const safeDisplay = display || ListDisplayType.CARD;
    const isTableView =
        safeDisplay === ListDisplayType.TABLE || safeDisplay === ListDisplayType.TABLE_PAGINATED;

    const handleItemClick = useCallback(
        (item: YearPlaylist) => {
            if (item.type === 'decade') {
                const decadeId = item.displayName; // e.g., "1980s"
                navigate(generatePath(AppRoute.LIBRARY_YEARS_DECADE, { decadeId }));
            } else {
                navigate(generatePath(AppRoute.LIBRARY_YEARS_DETAIL, { yearId: item.displayName }));
            }
        },
        [navigate],
    );

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
    }, []);

    const cacheKey = useMemo(() => {
        const typeFilter = ((filter as any)?._custom as any)?.typeFilter || 'all';
        const sortBy = (filter as any)?.sortBy || 'year';
        const sortOrderValue = (filter as any)?.sortOrder || SortOrder.DESC;

        // Ensure sortOrder is properly converted to enum value
        const sortOrder =
            sortOrderValue === SortOrder.ASC || sortOrderValue === 'asc'
                ? SortOrder.ASC
                : SortOrder.DESC;

        return ['years', server?.id, typeFilter, sortBy, sortOrder].join('|');
    }, [filter, server?.id]);

    // Apply type filter from store
    const typeFilter = (filter._custom as any)?.typeFilter || 'all';
    let filteredByType = yearsWithAlbums;
    if (typeFilter === 'decades') {
        filteredByType = yearsWithAlbums.filter((year) => year.type === 'decade');
    } else if (typeFilter === 'years') {
        filteredByType = yearsWithAlbums.filter((year) => year.type === 'year');
    }

    // Apply sorting
    const sortBy = (filter as any)?.sortBy || 'year';
    const sortOrder = (filter as any)?.sortOrder || 'desc';
    const sortedFilteredYears = useMemo(() => {
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
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [filteredByType, sortBy, sortOrder]);

    // Filter years based on search term from the already sorted and filtered years
    const filteredYears = sortedFilteredYears.filter((year) =>
        year.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (!server) {
        return (
            <Container>
                <YearsListHeader
                    gridRef={gridRef}
                    itemCount={0}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>
                    No server selected. Please configure a server first.
                </div>
            </Container>
        );
    }

    if (filteredYears.length === 0) {
        const noResultsMessage = searchTerm
            ? `No years found matching "${searchTerm}"`
            : typeFilter === 'decades'
              ? 'No decades available.'
              : typeFilter === 'years'
                ? 'No individual years available.'
                : 'No years available.';

        return (
            <Container>
                <YearsListHeader
                    gridRef={gridRef}
                    itemCount={0}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>{noResultsMessage}</div>
            </Container>
        );
    }

    return (
        <Container>
            <YearsListHeader
                gridRef={gridRef}
                itemCount={filteredYears.length}
                onSearch={handleSearch}
                tableRef={tableRef}
            />
            <Suspense fallback={<Spinner container />}>
                {isTableView ? (
                    <YearsListTableView
                        itemCount={filteredYears.length}
                        tableRef={tableRef}
                    />
                ) : (
                    <YearsListGridView
                        gridRef={gridRef}
                        itemCount={filteredYears.length}
                    />
                )}
            </Suspense>
        </Container>
    );
};

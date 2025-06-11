import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useProcessedYears } from '../hooks/use-processed-years';
import { YearPlaylist } from '../years-playlists';
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

    // Use centralized processing hook
    const { getAlbumsForYear, isLoading, sortedFilteredYears } = useProcessedYears(searchTerm);

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

    // All processing is now handled by useProcessedYears hook

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

    if (isLoading) {
        return (
            <Container>
                <YearsListHeader
                    gridRef={gridRef}
                    itemCount={undefined}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        height: '100%',
                        justifyContent: 'center',
                    }}
                >
                    <Spinner />
                </div>
            </Container>
        );
    }

    if (sortedFilteredYears.length === 0) {
        const noResultsMessage = searchTerm
            ? `No years found matching "${searchTerm}"`
            : 'No years with albums found';

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
                itemCount={sortedFilteredYears.length}
                onSearch={handleSearch}
                tableRef={tableRef}
            />
            <Suspense fallback={<Spinner container />}>
                {isTableView ? (
                    <YearsListTableView
                        itemCount={sortedFilteredYears.length}
                        searchTerm={searchTerm}
                        tableRef={tableRef}
                    />
                ) : (
                    <YearsListGridView
                        gridRef={gridRef}
                        itemCount={sortedFilteredYears.length}
                        searchTerm={searchTerm}
                    />
                )}
            </Suspense>
        </Container>
    );
};

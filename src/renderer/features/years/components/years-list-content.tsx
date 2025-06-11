import { useCallback, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useYearAlbumCounts } from '../hooks/use-year-album-counts';
import { YEAR_PLAYLISTS, YearPlaylist } from '../years-playlists';
import { YearAlbumMosaic } from './year-album-mosaic';
import { YearsListHeader } from './years-list-header';
import { YearsListTableView } from './years-list-table-view';

import { Text } from '/@/renderer/components/text';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';
import { ListDisplayType } from '/@/shared/types/types';

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
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

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

    // Filter years based on search term from the already filtered years with albums
    const filteredYears = yearsWithAlbums.filter((year) =>
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
        return (
            <Container>
                <YearsListHeader
                    gridRef={gridRef}
                    itemCount={0}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>
                    {searchTerm ? `No years found matching "${searchTerm}"` : 'No years available.'}
                </div>
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
            {isTableView ? (
                <YearsListTableView
                    itemCount={filteredYears.length}
                    tableRef={tableRef}
                />
            ) : (
                <GridContainer>
                    {filteredYears.map((year: YearPlaylist) => (
                        <YearCard
                            key={year.id}
                            onClick={() => handleItemClick(year)}
                        >
                            <YearAlbumMosaic
                                size={168}
                                yearPlaylist={year}
                            />
                            <YearInfo>
                                <Text
                                    size="lg"
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {year.displayName}
                                </Text>
                                <Text
                                    size="sm"
                                    style={{
                                        color: 'var(--main-fg-secondary)',
                                    }}
                                >
                                    {year.type === 'decade' ? 'Decade' : 'Year'}
                                    {(year as any).albumCount !== undefined &&
                                        ` • ${(year as any).albumCount} albums`}
                                </Text>
                            </YearInfo>
                        </YearCard>
                    ))}
                </GridContainer>
            )}
        </Container>
    );
};

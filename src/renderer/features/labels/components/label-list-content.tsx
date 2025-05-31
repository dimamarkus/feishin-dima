import { useCallback, useRef, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useLabelList } from '../queries/label-list-query';
import { Label } from '../services/label-aggregation';
import { LabelListHeader } from './label-list-header';

import { Text } from '/@/renderer/components/text';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

type LabelListContentProps = {
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

const LabelCard = styled.div`
    background: var(--card-default-bg);
    border-radius: var(--card-default-radius);
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s ease-in-out;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &:hover {
        background: var(--card-default-bg-hover);
    }
`;

const LabelInfo = styled.div`
    margin-bottom: 8px;
`;

const SampleAlbums = styled.div`
    margin-top: 12px;
`;

export const LabelListContent = ({ itemCount }: LabelListContentProps) => {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const [searchTerm, setSearchTerm] = useState('');

    // Create refs for the header component
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<any>(null);

    const labelQuery = useLabelList({
        options: {
            cacheTime: 1000 * 60 * 5, // 5 minutes
            enabled: Boolean(server), // Only enable when server exists
            staleTime: 1000 * 60 * 1, // 1 minute
        },
        query: {
            search: searchTerm || undefined,
            sortBy: 'name', // Default to alphabetical sorting
            sortOrder: 'asc',
        },
    });

    const handleItemClick = useCallback(
        (item: Label) => {
            navigate(
                generatePath(AppRoute.LIBRARY_LABELS_DETAIL, {
                    labelId: item.id,
                }),
            );
        },
        [navigate],
    );

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
    }, []);

    if (!server) {
        return (
            <Container>
                <LabelListHeader
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

    if (labelQuery.isLoading) {
        return (
            <Container>
                <LabelListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>Loading labels...</div>
            </Container>
        );
    }

    if (labelQuery.error) {
        return (
            <Container>
                <LabelListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>
                    Error loading labels: {String(labelQuery.error)}. Please check the browser
                    console for more details.
                </div>
            </Container>
        );
    }

    if (!labelQuery.data) {
        return (
            <Container>
                <LabelListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>No label data received from server.</div>
            </Container>
        );
    }

    if (!labelQuery.data.items || labelQuery.data.items.length === 0) {
        return (
            <Container>
                <LabelListHeader
                    gridRef={gridRef}
                    itemCount={0}
                    onSearch={handleSearch}
                    tableRef={tableRef}
                />
                <div style={{ padding: '20px' }}>
                    {searchTerm
                        ? `No labels found matching "${searchTerm}"`
                        : 'No labels found. Labels are extracted from album metadata (tags like "label", "organization", or "publisher").'}
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <LabelListHeader
                gridRef={gridRef}
                itemCount={labelQuery.data.items.length}
                onSearch={handleSearch}
                tableRef={tableRef}
            />
            <GridContainer>
                {labelQuery.data.items.map((label: Label) => (
                    <LabelCard
                        key={label.id}
                        onClick={() => handleItemClick(label)}
                    >
                        <LabelInfo>
                            <Text
                                size="lg"
                                style={{
                                    fontWeight: 600,
                                    marginBottom: '8px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label.name}
                            </Text>
                            <Text
                                opacity={0.8}
                                size="md"
                                style={{
                                    fontWeight: 500,
                                }}
                            >
                                {label.albumCount} album{label.albumCount !== 1 ? 's' : ''}
                            </Text>
                        </LabelInfo>

                        <SampleAlbums>
                            <Text
                                opacity={0.6}
                                size="xs"
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label.albums
                                    .slice(0, 2)
                                    .map((a) => a.name)
                                    .join(', ')}
                                {label.albums.length > 2 ? '...' : ''}
                            </Text>
                        </SampleAlbums>
                    </LabelCard>
                ))}
            </GridContainer>
        </Container>
    );
};

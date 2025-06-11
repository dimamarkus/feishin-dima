import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';

import { LabelListQuery, LabelListResponse, VirtualLabelAPI } from '../api/virtual-label-api';

import { queryKeys } from '/@/renderer/api/query-keys';
import { LABEL_CARD_ROWS } from '/@/renderer/components';
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

interface LabelListGridViewProps {
    gridRef: React.MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
}

export const LabelListGridView = ({ gridRef, itemCount }: LabelListGridViewProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { id, pageKey } = useListContext();
    const { display, filter, grid } = useListStoreByKey<LabelListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    const cardRows = useMemo(() => {
        const rows = [LABEL_CARD_ROWS.name, LABEL_CARD_ROWS.albumCount];
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
        const query: Omit<LabelListQuery, 'limit' | 'offset'> = {
            ...filter,
        };

        const queriesFromCache: [QueryKey, LabelListResponse | undefined][] =
            queryClient.getQueriesData({
                exact: false,
                fetchStatus: 'idle',
                queryKey: queryKeys.labels.list(server?.id || '', query),
                stale: false,
            });

        const itemData: any[] = [];

        for (const [, data] of queriesFromCache) {
            const { items, startIndex } = data || {};

            if (items && items.length !== 1 && startIndex !== undefined) {
                let itemIndex = 0;
                for (
                    let rowIndex = startIndex;
                    rowIndex < startIndex + items.length;
                    rowIndex += 1
                ) {
                    itemData[rowIndex] = items[itemIndex];
                    itemIndex += 1;
                }
            }
        }

        return itemData;
    }, [filter, queryClient, server?.id]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return [];
            }

            const query: LabelListQuery = {
                ...filter,
                limit: take,
                offset: skip,
            };

            const queryKey = queryKeys.labels.list(server?.id || '', query);

            const labels = await queryClient.fetchQuery({
                cacheTime: 1000 * 60 * 60, // 1 hour
                queryFn: async ({ signal }) => {
                    return VirtualLabelAPI.getLabelList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query,
                    });
                },
                queryKey,
                staleTime: 1000 * 60 * 15, // 15 minutes
            });

            return labels;
        },
        [filter, queryClient, server],
    );

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
                        itemCount={itemCount || 0}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.LABEL}
                        key={`label-list-${server?.id}-${display}`}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        onScroll={handleGridScroll}
                        ref={gridRef}
                        route={{
                            route: AppRoute.LIBRARY_LABELS_DETAIL,
                            slugs: [{ idProperty: 'id', slugProperty: 'labelId' }],
                        }}
                        width={width}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};

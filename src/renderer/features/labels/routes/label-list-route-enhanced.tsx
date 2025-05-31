import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useMemo, useRef } from 'react';

import { LabelListQuery } from '../api/virtual-label-api';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { LabelListContentEnhanced } from '/@/renderer/features/labels/components/label-list-content-enhanced';
import { LabelListHeader } from '/@/renderer/features/labels/components/label-list-header';
import { useLabelList } from '/@/renderer/features/labels/queries/label-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { useListStoreByKey } from '/@/renderer/store/list.store';

const LabelListRouteEnhanced = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const pageKey = 'label';
    const { filter } = useListStoreByKey<LabelListQuery>({ key: pageKey });

    const itemCountCheck = useLabelList({
        options: {
            enabled: Boolean(server),
        },
        query: {
            ...filter,
            limit: 1,
            offset: 0,
        },
    });

    const itemCount =
        itemCountCheck.data?.totalRecordCount === null
            ? undefined
            : itemCountCheck.data?.totalRecordCount;

    const providerValue = useMemo(() => {
        return {
            pageKey,
        };
    }, []);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <LabelListHeader
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
                <LabelListContentEnhanced
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default LabelListRouteEnhanced;

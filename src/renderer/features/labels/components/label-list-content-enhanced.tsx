import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { lazy, MutableRefObject, Suspense } from 'react';

import { Spinner } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { useListStoreByKey } from '/@/renderer/store';
import { ListDisplayType } from '/@/shared/types/types';

const LabelListGridView = lazy(() =>
    import('/@/renderer/features/labels/components/label-list-grid-view').then((module) => ({
        default: module.LabelListGridView,
    })),
);

const LabelListTableView = lazy(() =>
    import('/@/renderer/features/labels/components/label-list-table-view').then((module) => ({
        default: module.LabelListTableView,
    })),
);

interface LabelListContentEnhancedProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const LabelListContentEnhanced = ({
    gridRef,
    itemCount,
    tableRef,
}: LabelListContentEnhancedProps) => {
    const { pageKey } = useListContext();
    const { display } = useListStoreByKey({ key: pageKey });

    return (
        <Suspense fallback={<Spinner container />}>
            {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
                <LabelListGridView
                    gridRef={gridRef}
                    itemCount={itemCount}
                />
            ) : (
                <LabelListTableView
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            )}
        </Suspense>
    );
};

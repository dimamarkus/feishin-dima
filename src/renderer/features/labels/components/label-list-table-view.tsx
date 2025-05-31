import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject, useCallback } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { LABEL_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface LabelListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const LabelListTableView = ({ itemCount, tableRef }: LabelListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, pageKey } = useListContext();
    const navigate = useNavigate();

    const tableProps = useVirtualTable({
        contextMenu: LABEL_CONTEXT_MENU_ITEMS,
        customFilters,
        itemCount,
        itemType: LibraryItem.LABEL,
        pageKey,
        server,
        tableRef,
    });

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            const { data } = e;
            if (!data) return;

            navigate(generatePath(AppRoute.LIBRARY_LABELS_DETAIL, { labelId: data.id }));
        },
        [navigate],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
                onRowDoubleClicked={onRowDoubleClicked}
            />
        </VirtualGridAutoSizerContainer>
    );
};

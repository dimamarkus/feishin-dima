import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { useProcessedYears } from '../hooks/use-processed-years';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface YearsListTableViewProps {
    itemCount?: number;
    searchTerm?: string;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearsListTableView = ({
    itemCount,
    searchTerm = '',
    tableRef,
}: YearsListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, pageKey } = useListContext();
    const navigate = useNavigate();

    // Use centralized processing hook - single source of truth
    const { sortedFilteredYears } = useProcessedYears(searchTerm);

    // Convert years with album counts to format expected by the table
    const tableData = useMemo(() => {
        return sortedFilteredYears.map((year) => ({
            ...year,
            name: year.displayName, // Map displayName to name for table display
        }));
    }, [sortedFilteredYears]);

    const tableProps = useVirtualTable({
        contextMenu: [], // No context menu for years for now
        customFilters,
        isClientSide: true, // Important: use client-side data
        itemCount: tableData.length,
        itemType: LibraryItem.GENRE, // Use GENRE as placeholder since YEAR doesn't exist in LibraryItem
        pageKey,
        server,
        tableRef,
    });

    const handleCellDoubleClick = useCallback(
        (e: RowDoubleClickedEvent) => {
            const year = e.data;
            if (year?.type === 'decade') {
                const decadeId = year.displayName; // e.g., "1980s"
                navigate(generatePath(AppRoute.LIBRARY_YEARS_DECADE, { decadeId }));
            } else {
                navigate(generatePath(AppRoute.LIBRARY_YEARS_DETAIL, { yearId: year.displayName }));
            }
        },
        [navigate],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                {...tableProps}
                onCellDoubleClicked={handleCellDoubleClick}
                rowData={tableData}
            />
        </VirtualGridAutoSizerContainer>
    );
};

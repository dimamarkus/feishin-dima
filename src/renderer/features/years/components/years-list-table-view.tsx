import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { YEAR_PLAYLISTS, YearPlaylist } from '../years-playlists';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface YearsListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearsListTableView = ({ itemCount, tableRef }: YearsListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, pageKey } = useListContext();
    const navigate = useNavigate();

    // Convert YEAR_PLAYLISTS to format expected by the table
    const tableData = useMemo(() => {
        return YEAR_PLAYLISTS.map((year) => ({
            ...year,
            name: year.displayName, // Map displayName to name for table display
        }));
    }, []);

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

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            const { data } = e;
            if (!data) return;

            const yearPlaylist = data as YearPlaylist;
            if (yearPlaylist.type === 'decade') {
                navigate(
                    generatePath(AppRoute.LIBRARY_YEARS_DECADE, {
                        decadeId: yearPlaylist.displayName,
                    }),
                );
            } else {
                navigate(
                    generatePath(AppRoute.LIBRARY_YEARS_DETAIL, {
                        yearId: yearPlaylist.displayName,
                    }),
                );
            }
        },
        [navigate],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`years-table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                rowData={tableData} // Provide static data directly
                {...tableProps}
                onRowDoubleClicked={onRowDoubleClicked}
            />
        </VirtualGridAutoSizerContainer>
    );
};

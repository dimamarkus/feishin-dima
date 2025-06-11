import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { useYearAlbumCounts } from '../hooks/use-year-album-counts';
import { YEAR_PLAYLISTS, YearPlaylist } from '../years-playlists';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface YearsListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearsListTableView = ({ itemCount, tableRef }: YearsListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, pageKey } = useListContext();
    const { filter } = useListStoreByKey({ key: pageKey });
    const navigate = useNavigate();

    // Get album counts for all years and filter out empty ones
    const { yearsWithAlbums } = useYearAlbumCounts(YEAR_PLAYLISTS);

    // Apply type filter from store
    const typeFilter = (filter._custom as any)?.typeFilter || 'all';
    const filteredYears = useMemo(() => {
        if (typeFilter === 'decades') {
            return yearsWithAlbums.filter((year) => year.type === 'decade');
        } else if (typeFilter === 'years') {
            return yearsWithAlbums.filter((year) => year.type === 'year');
        }
        return yearsWithAlbums;
    }, [yearsWithAlbums, typeFilter]);

    // Convert years with album counts to format expected by the table
    const tableData = useMemo(() => {
        return filteredYears.map((year) => ({
            ...year,
            name: year.displayName, // Map displayName to name for table display
        }));
    }, [filteredYears]);

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
                // Key is used to force remount of table when display, rowHeight, server, or filter changes
                key={`years-table-${tableProps.rowHeight}-${server?.id}-${typeFilter}`}
                ref={tableRef}
                rowData={tableData} // Provide static data directly
                {...tableProps}
                onRowDoubleClicked={onRowDoubleClicked}
            />
        </VirtualGridAutoSizerContainer>
    );
};

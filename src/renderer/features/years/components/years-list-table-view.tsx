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
import { LibraryItem, SortOrder } from '/@/shared/types/domain-types';

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
    const typeFilter = ((filter as any)?._custom as any)?.typeFilter || 'all';
    const filteredYears = useMemo(() => {
        if (typeFilter === 'decades') {
            return yearsWithAlbums.filter((year) => year.type === 'decade');
        } else if (typeFilter === 'years') {
            return yearsWithAlbums.filter((year) => year.type === 'year');
        }
        return yearsWithAlbums;
    }, [yearsWithAlbums, typeFilter]);

    // Apply sorting
    const sortBy = (filter as any)?.sortBy || 'year';
    const sortOrderValue = (filter as any)?.sortOrder || SortOrder.DESC;

    // Ensure sortOrder is properly converted to enum value
    const sortOrder =
        sortOrderValue === SortOrder.ASC || sortOrderValue === 'asc'
            ? SortOrder.ASC
            : SortOrder.DESC;

    const sortedAndFilteredYears = useMemo(() => {
        const sorted = [...filteredYears].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'albumCount':
                    aValue = a.albumCount || 0;
                    bValue = b.albumCount || 0;
                    break;
                case 'year':
                default:
                    // For decades, use the start year (e.g., 1980 for "1980s")
                    aValue =
                        a.type === 'decade' ? parseInt(a.displayName) : parseInt(a.displayName);
                    bValue =
                        b.type === 'decade' ? parseInt(b.displayName) : parseInt(b.displayName);
                    break;
            }

            if (aValue < bValue) {
                return sortOrder === SortOrder.ASC ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortOrder === SortOrder.ASC ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [filteredYears, sortBy, sortOrder]);

    // Convert years with album counts to format expected by the table
    const tableData = useMemo(() => {
        return sortedAndFilteredYears.map((year) => ({
            ...year,
            name: year.displayName, // Map displayName to name for table display
        }));
    }, [sortedAndFilteredYears]);

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
                key={`years-table-${tableProps.rowHeight}-${server?.id}-${typeFilter}-${sortBy}-${sortOrder}`}
                ref={tableRef}
                rowData={tableData} // Provide static data directly
                {...tableProps}
                onRowDoubleClicked={onRowDoubleClicked}
            />
        </VirtualGridAutoSizerContainer>
    );
};

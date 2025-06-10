import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Divider } from '@mantine/core';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { GenreFilterDropdown } from '/@/renderer/features/shared/components/genre-filter-dropdown';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { AlbumListQuery, LibraryItem } from '/@/shared/types/domain-types';
import { Album } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

interface YearAlbumListFiltersProps {
    albums?: Album[];
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount: number | undefined;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearAlbumListFilters = ({
    albums = [],
    gridRef,
    itemCount,
    tableRef,
}: YearAlbumListFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { setFilter } = useListStoreActions();
    const { customFilters, pageKey } = useListContext();
    const { display, filter } = useListStoreByKey<AlbumListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.ALBUM,
        server,
    });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    const handleGenreChange = useCallback(
        (genres: string[]) => {
            setFilter({
                customFilters,
                data: { genres: genres.length > 0 ? genres : undefined },
                itemType: LibraryItem.ALBUM,
                key: pageKey,
            });

            // Trigger refresh with the new filter
            const newFilter = { ...filter, genres: genres.length > 0 ? genres : undefined };

            if (isGrid) {
                handleRefreshGrid(gridRef, {
                    ...newFilter,
                    ...customFilters,
                });
            } else {
                handleRefreshTable(tableRef, {
                    ...newFilter,
                    ...customFilters,
                });
            }
        },
        [
            customFilters,
            filter,
            gridRef,
            handleRefreshGrid,
            handleRefreshTable,
            isGrid,
            pageKey,
            setFilter,
            tableRef,
        ],
    );

    // Check if genre filter has options to show
    const hasGenreOptions = useMemo(() => {
        const genreSet = new Set<string>();
        albums.forEach((album) => {
            album.genres?.forEach((genre) => {
                genreSet.add(genre.name);
            });
        });
        return genreSet.size > 0;
    }, [albums]);

    // We need to extend the AlbumListHeaderFilters to include our genre dropdown
    // For now, we'll render the original component and inject our dropdown via CSS
    return (
        <div style={{ position: 'relative' }}>
            <AlbumListHeaderFilters
                gridRef={gridRef}
                itemCount={itemCount}
                tableRef={tableRef}
            />
            {hasGenreOptions && (
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: '8px',
                        position: 'absolute',
                        right: '80px', // Position between refresh and 3 dots button
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                    }}
                >
                    <Divider
                        orientation="vertical"
                        style={{ height: '20px' }}
                    />
                    <GenreFilterDropdown
                        albums={albums}
                        onChange={handleGenreChange}
                        placeholder={t('filter.genre', { postProcess: 'titleCase' })}
                        value={filter.genres || []}
                    />
                </div>
            )}
        </div>
    );
};

import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Divider } from '@mantine/core';
import { MutableRefObject, useCallback, useMemo } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { GenreDropdown } from '/@/renderer/features/shared/components/genre-dropdown';
import { StylesFilterDropdown } from '/@/renderer/features/shared/components/styles-filter-dropdown';
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

    // Extract the current genre and styles from the filter
    const currentGenre = (filter._custom as any)?.genre as string | undefined;
    const currentStyles = filter.genres || [];

    const refreshWithFilters = useCallback(
        (genre?: string, styles?: string[]) => {
            const newFilter = {
                ...filter,
                _custom: {
                    ...filter._custom,
                    genre: genre || undefined,
                },
                genres: styles?.length ? styles : undefined,
            };

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
        [customFilters, filter, gridRef, handleRefreshGrid, handleRefreshTable, isGrid, tableRef],
    );

    const handleGenreChange = useCallback(
        (genre: string | undefined) => {
            setFilter({
                customFilters,
                data: { _custom: { ...filter._custom, genre } as any },
                itemType: LibraryItem.ALBUM,
                key: pageKey,
            });

            // When genre changes, clear styles as they need to be re-filtered
            refreshWithFilters(genre, []);
        },
        [customFilters, filter._custom, pageKey, refreshWithFilters, setFilter],
    );

    const handleStylesChange = useCallback(
        (styles: string[]) => {
            setFilter({
                customFilters,
                data: { genres: styles.length > 0 ? styles : undefined },
                itemType: LibraryItem.ALBUM,
                key: pageKey,
            });

            refreshWithFilters(currentGenre, styles);
        },
        [customFilters, currentGenre, pageKey, refreshWithFilters, setFilter],
    );

    // Extract available genres for the genre dropdown
    const availableGenres = useMemo(() => {
        const genreSet = new Set<string>();
        albums.forEach((album) => {
            album.genres?.forEach((genre) => {
                genreSet.add(genre.name);
            });
        });
        return genreSet;
    }, [albums]);

    // Check if we have any genres or styles available
    const hasFilters = availableGenres.size > 0;

    return (
        <div style={{ position: 'relative' }}>
            <AlbumListHeaderFilters
                gridRef={gridRef}
                itemCount={itemCount}
                tableRef={tableRef}
            />
            {hasFilters && (
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: '8px',
                        position: 'absolute',
                        right: '160px', // Move further left to accommodate both dropdowns
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                    }}
                >
                    <Divider
                        orientation="vertical"
                        style={{ height: '20px' }}
                    />
                    <GenreDropdown
                        availableGenres={availableGenres}
                        onChange={handleGenreChange}
                        placeholder="Any genre"
                        value={currentGenre}
                    />
                    <StylesFilterDropdown
                        albums={albums}
                        onChange={handleStylesChange}
                        placeholder="Styles"
                        selectedGenre={currentGenre}
                        value={currentStyles}
                    />
                </div>
            )}
        </div>
    );
};

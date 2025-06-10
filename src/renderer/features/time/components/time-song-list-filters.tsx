import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Divider } from '@mantine/core';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { GenreFilterDropdown } from '/@/renderer/features/shared/components/genre-filter-dropdown';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { LibraryItem, Song, SongListQuery } from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

interface TimeSongListFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount: number | undefined;
    songs?: Song[];
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const TimeSongListFilters = ({
    gridRef,
    itemCount,
    songs = [],
    tableRef,
}: TimeSongListFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { setFilter } = useListStoreActions();
    const { customFilters, pageKey } = useListContext();
    const { display, filter } = useListStoreByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.SONG,
        server,
    });

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    const handleGenreChange = useCallback(
        (genres: string[]) => {
            setFilter({
                customFilters,
                data: { genreIds: genres.length > 0 ? genres : undefined },
                itemType: LibraryItem.SONG,
                key: pageKey,
            });

            // Trigger refresh with the new filter
            const newFilter = { ...filter, genreIds: genres.length > 0 ? genres : undefined };

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
        songs.forEach((song) => {
            song.genres?.forEach((genre) => {
                genreSet.add(genre.name);
            });
        });
        return genreSet.size > 0;
    }, [songs]);

    return (
        <div style={{ position: 'relative' }}>
            <SongListHeaderFilters
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
                        onChange={handleGenreChange}
                        placeholder={t('filter.genre', { postProcess: 'titleCase' })}
                        songs={songs}
                        value={filter.genreIds || []}
                    />
                </div>
            )}
        </div>
    );
};

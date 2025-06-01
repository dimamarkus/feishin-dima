import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Select, Switch, Text } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { GenreListSort, LibraryItem, SongListQuery, SortOrder } from '/@/shared/types/domain-types';

interface SubsonicSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const SubsonicSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: SubsonicSongFiltersProps) => {
    const { t } = useTranslation();
    const { setFilter } = useListStoreActions();
    const filter = useListFilterByKey<SongListQuery>({ key: pageKey });

    const isGenrePage = customFilters?.genreIds !== undefined;

    // Get a sample of songs from the current context to extract available genres
    const contextualSongsQuery = useSongList({
        options: {
            enabled: !!customFilters, // Only fetch if we have custom filters (i.e., in a time playlist)
        },
        query: {
            ...customFilters,
            limit: 500, // Sample size to extract genres from
            startIndex: 0,
        },
        serverId,
    });

    // Extract unique genres from the contextual songs
    const contextualGenreList = useMemo(() => {
        if (!contextualSongsQuery.data?.items?.length) return [];

        const uniqueGenres = new Map<string, { label: string; value: string }>();

        contextualSongsQuery.data.items.forEach((song) => {
            song.genres?.forEach((genre) => {
                uniqueGenres.set(genre.id, {
                    label: genre.name,
                    value: genre.id,
                });
            });
        });

        return Array.from(uniqueGenres.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [contextualSongsQuery.data]);

    const genreListQuery = useGenreList({
        options: {
            enabled: !customFilters, // Only fetch full list if no custom filters
        },
        query: {
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId,
    });

    const fullGenreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    // Use contextual genres if available, otherwise fall back to full list
    const genreList = customFilters ? contextualGenreList : fullGenreList;

    const handleGenresFilter = debounce((e: null | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                genreIds: e ? [e] : undefined,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const toggleFilters = [
        {
            disabled: filter.genreIds !== undefined || isGenrePage || !!filter.searchTerm,
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        favorite: e.target.checked,
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;

                onFilterChange(updatedFilters);
            },
            value: filter.favorite,
        },
    ];

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group
                    key={`ss-filter-${filter.label}`}
                    position="apart"
                >
                    <Text>{filter.label}</Text>
                    <Switch
                        checked={filter?.value || false}
                        disabled={filter.disabled}
                        onChange={filter.onChange}
                        size="xs"
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                {!isGenrePage && (
                    <Select
                        clearable
                        data={genreList}
                        defaultValue={filter.genreIds ? filter.genreIds[0] : undefined}
                        disabled={!!filter.searchTerm}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={150}
                    />
                )}
            </Group>
        </Stack>
    );
};

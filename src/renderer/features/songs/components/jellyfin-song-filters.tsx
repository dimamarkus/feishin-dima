import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NumberInput, Switch, Text } from '/@/renderer/components';
import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useGenreList } from '/@/renderer/features/genres';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { SongListFilter, useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import {
    GenreListSort,
    LibraryItem,
    SongListQuery,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

interface JellyfinSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const JellyfinSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: JellyfinSongFiltersProps) => {
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
            sortBy: SongListSort.NAME, // Required field
            sortOrder: SortOrder.ASC, // Required field
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

    // Extract year range from contextual songs
    const contextualYearRange = useMemo(() => {
        if (!contextualSongsQuery.data?.items?.length) return { max: undefined, min: undefined };

        const years = contextualSongsQuery.data.items
            .filter((song) => song.releaseYear)
            .map((song) => Number(song.releaseYear))
            .sort((a, b) => a - b);

        return {
            max: years.length > 0 ? years[years.length - 1] : undefined,
            min: years.length > 0 ? years[0] : undefined,
        };
    }, [contextualSongsQuery.data]);

    // Despite the fact that getTags returns genres, it only returns genre names.
    // We prefer using IDs, hence the double query
    const genreListQuery = useGenreList({
        options: {
            enabled: !customFilters, // Only fetch full list if no custom filters
        },
        query: {
            musicFolderId: filter?.musicFolderId,
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

    const tagsQuery = useTagList({
        query: {
            folder: filter?.musicFolderId,
            type: LibraryItem.SONG,
        },
        serverId,
    });

    const selectedGenres = useMemo(() => {
        return filter?._custom?.jellyfin?.GenreIds?.split(',');
    }, [filter?._custom?.jellyfin?.GenreIds]);

    const selectedTags = useMemo(() => {
        return filter?._custom?.jellyfin?.Tags?.split('|');
    }, [filter?._custom?.jellyfin?.Tags]);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: {
                            ...filter?._custom,
                            jellyfin: {
                                ...filter?._custom?.jellyfin,
                                IncludeItemTypes: 'Audio',
                            },
                        },
                        favorite: e.currentTarget.checked ? true : undefined,
                    },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
                onFilterChange(updatedFilters);
            },
            value: filter.favorite,
        },
    ];

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                minYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleMaxYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                maxYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                    },
                },
                genreIds: e,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    const handleTagFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    jellyfin: {
                        ...filter?._custom?.jellyfin,
                        IncludeItemTypes: 'Audio',
                        Tags: e?.join('|') || undefined,
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        onFilterChange(updatedFilters);
    }, 250);

    return (
        <Stack p="0.8rem">
            {toggleFilters.map((filter) => (
                <Group
                    key={`nd-filter-${filter.label}`}
                    position="apart"
                >
                    <Text>{filter.label}</Text>
                    <Switch
                        checked={filter?.value || false}
                        onChange={filter.onChange}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={filter?.minYear}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={customFilters ? contextualYearRange.max || 2300 : 2300}
                    min={customFilters ? contextualYearRange.min || 1700 : 1700}
                    onChange={handleMinYearFilter}
                    placeholder={
                        customFilters && contextualYearRange.min
                            ? `${contextualYearRange.min}`
                            : undefined
                    }
                    required={!!filter?.minYear}
                />
                <NumberInput
                    defaultValue={filter?.maxYear}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={customFilters ? contextualYearRange.max || 2300 : 2300}
                    min={customFilters ? contextualYearRange.min || 1700 : 1700}
                    onChange={handleMaxYearFilter}
                    placeholder={
                        customFilters && contextualYearRange.max
                            ? `${contextualYearRange.max}`
                            : undefined
                    }
                    required={!!filter?.minYear}
                />
            </Group>
            {!isGenrePage && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={selectedGenres}
                        label={t('entity.genre', { count: 1, postProcess: 'sentenceCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
            {tagsQuery.data?.boolTags?.length && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={tagsQuery.data.boolTags}
                        defaultValue={selectedTags}
                        label={t('common.tags', { postProcess: 'sentenceCase' })}
                        onChange={handleTagFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
        </Stack>
    );
};

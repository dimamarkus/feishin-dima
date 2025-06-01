import { Divider, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NumberInput, Switch, Text } from '/@/renderer/components';
import { SelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
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

interface NavidromeSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
    onFilterChange: (filters: SongListFilter) => void;
    pageKey: string;
    serverId?: string;
}

export const NavidromeSongFilters = ({
    customFilters,
    onFilterChange,
    pageKey,
    serverId,
}: NavidromeSongFiltersProps) => {
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

    // Extract contextual tag values from songs for all tag fields
    const contextualTagOptions = useMemo(() => {
        if (!contextualSongsQuery.data?.items?.length) return new Map<string, string[]>();

        const tagMap = new Map<string, Set<string>>();

        contextualSongsQuery.data.items.forEach((song) => {
            // Extract values from song.tags which contains all the Navidrome tag fields
            if (song.tags) {
                Object.entries(song.tags).forEach(([tagName, tagValues]) => {
                    if (Array.isArray(tagValues)) {
                        const existingValues = tagMap.get(tagName) || new Set();
                        tagValues.forEach((value) => existingValues.add(value));
                        tagMap.set(tagName, existingValues);
                    }
                });
            }
        });

        // Convert Sets to sorted arrays
        const result = new Map<string, string[]>();
        tagMap.forEach((valueSet, tagName) => {
            result.set(tagName, Array.from(valueSet).sort());
        });

        return result;
    }, [contextualSongsQuery.data]);

    // Create contextual tag options in the format expected by useTagList
    const contextualTagList = useMemo(() => {
        if (!customFilters || contextualTagOptions.size === 0) return undefined;

        return {
            boolTags: undefined,
            enumTags: Array.from(contextualTagOptions.entries())
                .map(([tagName, tagValues]) => ({
                    name: tagName,
                    options: tagValues,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [contextualTagOptions, customFilters]);

    // Fall back to full genre list if we don't have custom filters
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

    const tagsQuery = useTagList({
        options: {
            enabled: !customFilters, // Only fetch full tags if no custom filters
        },
        query: {
            type: LibraryItem.SONG,
        },
        serverId,
    });

    // Use contextual tags if available, otherwise fall back to full tag list
    const tagData = customFilters ? contextualTagList : tagsQuery.data;

    const handleGenresFilter = debounce((e: null | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter._custom,
                genreIds: e ? [e] : undefined,
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const handleTagFilter = debounce((tag: string, e: null | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        ...filter._custom?.navidrome,
                        [tag]: e || undefined,
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 250);

    const toggleFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter._custom,
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

    const handleYearFilter = debounce((e: number | string) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter._custom,
                    navidrome: {
                        ...filter._custom?.navidrome,
                        year: e === '' ? undefined : (e as number),
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        onFilterChange(updatedFilters);
    }, 500);

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
                        size="xs"
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e)}
                    value={filter._custom?.navidrome?.year}
                    width={50}
                />
                {!isGenrePage && (
                    <SelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={filter.genreIds ? filter.genreIds[0] : undefined}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={150}
                    />
                )}
            </Group>
            {tagData?.enumTags?.length &&
                tagData.enumTags.map((tag) => (
                    <Group
                        grow
                        key={tag.name}
                    >
                        <SelectWithInvalidData
                            clearable
                            data={contextualTagOptions.get(tag.name) || []}
                            defaultValue={
                                filter._custom?.navidrome?.[tag.name] as string | undefined
                            }
                            label={tag.name}
                            onChange={(value) => handleTagFilter(tag.name, value)}
                            searchable
                            width={150}
                        />
                    </Group>
                ))}
        </Stack>
    );
};

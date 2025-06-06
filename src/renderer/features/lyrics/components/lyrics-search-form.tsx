import { Divider, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { openModal } from '@mantine/modals';
import orderBy from 'lodash/orderBy';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import i18n from '/@/i18n/i18n';
import { ScrollArea, Spinner, Text, TextInput } from '/@/renderer/components';
import { useLyricSearch } from '/@/renderer/features/lyrics/queries/lyric-search-query';
import {
    InternetProviderLyricSearchResponse,
    LyricSource,
    LyricsOverride,
} from '/@/shared/types/domain-types';

const SearchItem = styled.button`
    all: unset;
    box-sizing: border-box !important;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 5px;

    &:hover,
    &:focus-visible {
        color: var(--btn-default-fg-hover);
        background: var(--btn-default-bg-hover);
    }
`;

interface SearchResultProps {
    data: InternetProviderLyricSearchResponse;
    onClick?: () => void;
}
const SearchResult = ({ data, onClick }: SearchResultProps) => {
    const { artist, id, name, score, source } = data;

    const percentageScore = useMemo(() => {
        if (!score) return 0;
        return ((1 - score) * 100).toFixed(2);
    }, [score]);

    const cleanId =
        source === LyricSource.GENIUS ? id.replace(/^((http[s]?|ftp):\/)?\/?([^:/\s]+)/g, '') : id;

    return (
        <SearchItem onClick={onClick}>
            <Group
                noWrap
                position="apart"
            >
                <Stack
                    maw="65%"
                    spacing={0}
                >
                    <Text
                        size="md"
                        weight={600}
                    >
                        {name}
                    </Text>
                    <Text $secondary>{artist}</Text>
                    <Group
                        noWrap
                        spacing="sm"
                    >
                        <Text
                            $secondary
                            size="sm"
                        >
                            {[source, cleanId].join(' — ')}
                        </Text>
                    </Group>
                </Stack>
                <Text>{percentageScore}%</Text>
            </Group>
        </SearchItem>
    );
};

interface LyricSearchFormProps {
    artist?: string;
    name?: string;
    onSearchOverride?: (params: LyricsOverride) => void;
}

export const LyricsSearchForm = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            artist: artist || '',
            name: name || '',
        },
    });

    const [debouncedArtist] = useDebouncedValue(form.values.artist, 500);
    const [debouncedName] = useDebouncedValue(form.values.name, 500);

    const { data, isInitialLoading } = useLyricSearch({
        query: { artist: debouncedArtist, name: debouncedName },
    });

    const searchResults = useMemo(() => {
        if (!data) return [];

        const results: InternetProviderLyricSearchResponse[] = [];
        Object.keys(data).forEach((key) => {
            (data[key as keyof typeof data] || []).forEach((result) => results.push(result));
        });

        const scoredResults = orderBy(results, ['score'], ['asc']);

        return scoredResults;
    }, [data]);

    return (
        <Stack w="100%">
            <form>
                <Group grow>
                    <TextInput
                        data-autofocus
                        label={t('form.lyricSearch.input', {
                            context: 'name',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        label={t('form.lyricSearch.input', {
                            context: 'artist',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('artist')}
                    />
                </Group>
            </form>
            <Divider />
            {isInitialLoading ? (
                <Spinner container />
            ) : (
                <ScrollArea
                    h={400}
                    offsetScrollbars
                    pr="1rem"
                    type="auto"
                    w="100%"
                >
                    <Stack spacing="md">
                        {searchResults.map((result) => (
                            <SearchResult
                                data={result}
                                key={`${result.source}-${result.id}`}
                                onClick={() => {
                                    onSearchOverride?.({
                                        artist: result.artist,
                                        id: result.id,
                                        name: result.name,
                                        remote: true,
                                        source: result.source as LyricSource,
                                    });
                                }}
                            />
                        ))}
                    </Stack>
                </ScrollArea>
            )}
        </Stack>
    );
};

export const openLyricSearchModal = ({ artist, name, onSearchOverride }: LyricSearchFormProps) => {
    openModal({
        children: (
            <LyricsSearchForm
                artist={artist}
                name={name}
                onSearchOverride={onSearchOverride}
            />
        ),
        size: 'lg',
        title: i18n.t('form.lyricSearch.title', { postProcess: 'titleCase' }) as string,
    });
};

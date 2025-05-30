import { Divider, Group, SelectItem, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { QueryClient } from '@tanstack/react-query';
import merge from 'lodash/merge';
import { useMemo } from 'react';
import { RiAddBoxFill, RiAddCircleFill, RiPlayFill } from 'react-icons/ri';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Button, Checkbox, NumberInput, Select } from '/@/renderer/components';
import { useAuthStore } from '/@/renderer/store';
import {
    GenreListResponse,
    GenreListSort,
    MusicFolderListResponse,
    Played,
    RandomSongListQuery,
    ServerListItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface ShuffleAllSlice extends RandomSongListQuery {
    actions: {
        setStore: (data: Partial<ShuffleAllSlice>) => void;
    };
    enableMaxYear: boolean;
    enableMinYear: boolean;
}

const useShuffleAllStore = create<ShuffleAllSlice>()(
    persist(
        immer((set, get) => ({
            actions: {
                setStore: (data) => {
                    set({ ...get(), ...data });
                },
            },
            enableMaxYear: false,
            enableMinYear: false,
            genre: '',
            maxYear: 2020,
            minYear: 2000,
            musicFolder: '',
            played: Played.All,
            songCount: 100,
        })),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_shuffle_all',
            version: 1,
        },
    ),
);

const PLAYED_DATA: SelectItem[] = [
    { label: 'all tracks', value: Played.All },
    { label: 'only unplayed tracks', value: Played.Never },
    { label: 'only played tracks', value: Played.Played },
];

export const useShuffleAllStoreActions = () => useShuffleAllStore((state) => state.actions);

interface ShuffleAllModalProps {
    genres: GenreListResponse | undefined;
    handlePlayQueueAdd: ((options: PlayQueueAddOptions) => void) | undefined;
    musicFolders: MusicFolderListResponse | undefined;
    queryClient: QueryClient;
    server: null | ServerListItem;
}

export const ShuffleAllModal = ({
    genres,
    handlePlayQueueAdd,
    musicFolders,
    queryClient,
    server,
}: ShuffleAllModalProps) => {
    const { enableMaxYear, enableMinYear, genre, limit, maxYear, minYear, musicFolderId, played } =
        useShuffleAllStore();
    const { setStore } = useShuffleAllStoreActions();

    const handlePlay = async (playType: Play) => {
        const res = await queryClient.fetchQuery({
            cacheTime: 0,
            queryFn: ({ signal }) =>
                api.controller.getRandomSongList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query: {
                        genre: genre || undefined,
                        limit,
                        maxYear: enableMaxYear ? maxYear || undefined : undefined,
                        minYear: enableMinYear ? minYear || undefined : undefined,
                        musicFolderId: musicFolderId || undefined,
                        played,
                    },
                }),
            queryKey: queryKeys.songs.randomSongList(server?.id),
            staleTime: 0,
        });

        handlePlayQueueAdd?.({
            byData: res?.items || [],
            playType,
        });

        closeAllModals();
    };

    const genreData = useMemo(() => {
        if (!genres) return [];

        return genres.items.map((genre) => {
            const value =
                server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC
                    ? genre.name
                    : genre.id;
            return {
                label: genre.name,
                value,
            };
        });
    }, [genres, server?.type]);

    const musicFolderData = useMemo(() => {
        if (!musicFolders) return [];
        return musicFolders.items.map((musicFolder) => ({
            label: musicFolder.name,
            value: String(musicFolder.id),
        }));
    }, [musicFolders]);

    return (
        <Stack spacing="md">
            <NumberInput
                label="How many tracks?"
                max={500}
                min={1}
                onChange={(e) => setStore({ limit: e ? Number(e) : 500 })}
                required
                value={limit}
            />
            <Group grow>
                <NumberInput
                    label="From year"
                    max={2050}
                    min={1850}
                    onChange={(e) => setStore({ minYear: e ? Number(e) : 0 })}
                    rightSection={
                        <Checkbox
                            checked={enableMinYear}
                            mr="0.5rem"
                            onChange={(e) => setStore({ enableMinYear: e.currentTarget.checked })}
                        />
                    }
                    value={minYear}
                />

                <NumberInput
                    label="To year"
                    max={2050}
                    min={1850}
                    onChange={(e) => setStore({ maxYear: e ? Number(e) : 0 })}
                    rightSection={
                        <Checkbox
                            checked={enableMaxYear}
                            mr="0.5rem"
                            onChange={(e) => setStore({ enableMaxYear: e.currentTarget.checked })}
                        />
                    }
                    value={maxYear}
                />
            </Group>
            <Select
                clearable
                data={genreData}
                label="Genre"
                onChange={(e) => setStore({ genre: e || '' })}
                value={genre}
            />
            <Select
                clearable
                data={musicFolderData}
                label="Music folder"
                onChange={(e) => {
                    setStore({ musicFolderId: e ? String(e) : '' });
                }}
                value={musicFolderId}
            />
            {server?.type === ServerType.JELLYFIN && (
                <Select
                    clearable
                    data={PLAYED_DATA}
                    label="Play filter"
                    onChange={(e) => {
                        setStore({ played: e as Played });
                    }}
                    value={played}
                />
            )}
            <Divider />
            <Group grow>
                <Button
                    disabled={!limit}
                    leftIcon={<RiAddBoxFill size="1rem" />}
                    onClick={() => handlePlay(Play.LAST)}
                    type="submit"
                    variant="default"
                >
                    Add
                </Button>
                <Button
                    disabled={!limit}
                    leftIcon={<RiAddCircleFill size="1rem" />}
                    onClick={() => handlePlay(Play.NEXT)}
                    type="submit"
                    variant="default"
                >
                    Add next
                </Button>
            </Group>
            <Button
                disabled={!limit}
                leftIcon={<RiPlayFill size="1rem" />}
                onClick={() => handlePlay(Play.NOW)}
                type="submit"
                variant="filled"
            >
                Play
            </Button>
        </Stack>
    );
};

export const openShuffleAllModal = async (
    props: Pick<ShuffleAllModalProps, 'handlePlayQueueAdd' | 'queryClient'>,
) => {
    const server = useAuthStore.getState().currentServer;

    const genres = await props.queryClient.fetchQuery({
        cacheTime: 1000 * 60 * 60 * 4,
        queryFn: ({ signal }) =>
            api.controller.getGenreList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    sortBy: GenreListSort.NAME,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                },
            }),
        queryKey: queryKeys.genres.list(server?.id),
        staleTime: 1000 * 60 * 5,
    });

    const musicFolders = await props.queryClient.fetchQuery({
        cacheTime: 1000 * 60 * 60 * 4,
        queryFn: ({ signal }) =>
            api.controller.getMusicFolderList({
                apiClientProps: {
                    server,
                    signal,
                },
            }),
        queryKey: queryKeys.musicFolders.list(server?.id),
        staleTime: 1000 * 60 * 5,
    });

    openModal({
        children: (
            <ShuffleAllModal
                genres={genres}
                musicFolders={musicFolders}
                server={server}
                {...props}
            />
        ),
        size: 'sm',
        title: i18n.t('player.playRandom', { postProcess: 'sentenceCase' }) as string,
    });
};

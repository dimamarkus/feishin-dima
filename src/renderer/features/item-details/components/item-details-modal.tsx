import { Group, Table } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import { RiCheckFill, RiCloseFill } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import { api } from '/@/renderer/api';
import { Spinner, Spoiler, Text } from '/@/renderer/components';
import { Separator } from '/@/renderer/components/separator';
import { SongPath } from '/@/renderer/features/item-details/components/song-path';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString, formatSizeString } from '/@/renderer/utils';
import { formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import {
    Album,
    AlbumArtist,
    AnyLibraryItem,
    LibraryItem,
    RelatedArtist,
    Song,
} from '/@/shared/types/domain-types';

export type ItemDetailsModalProps = {
    item: Album | AlbumArtist | Song;
};

type ItemDetailRow<T> = {
    key?: keyof T;
    label: string;
    postprocess?: string[];
    render?: (item: T) => ReactNode;
};

const handleRow = <T extends AnyLibraryItem>(t: TFunction, item: T, rule: ItemDetailRow<T>) => {
    let value: ReactNode;

    if (rule.render) {
        value = rule.render(item);
    } else {
        const prop = item[rule.key!];
        value = prop !== undefined && prop !== null ? String(prop) : null;
    }

    if (!value) return null;

    return (
        <tr key={rule.label}>
            <td>{t(rule.label, { postProcess: rule.postprocess || 'sentenceCase' })}</td>
            <td>{value}</td>
        </tr>
    );
};

const formatArtists = (artists: null | RelatedArtist[] | undefined) =>
    artists?.map((artist, index) => (
        <span key={artist.id || artist.name}>
            {index > 0 && <Separator />}
            {artist.id ? (
                <Text
                    $link
                    component={Link}
                    overflow="visible"
                    size="md"
                    to={
                        artist.id
                            ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                  albumArtistId: artist.id,
                              })
                            : ''
                    }
                    weight={500}
                >
                    {artist.name || '—'}
                </Text>
            ) : (
                <Text
                    overflow="visible"
                    size="md"
                >
                    {artist.name || '-'}
                </Text>
            )}
        </span>
    ));

const formatComment = (item: Album | Song) =>
    item.comment ? <Spoiler maxHeight={50}>{replaceURLWithHTMLLinks(item.comment)}</Spoiler> : null;

const FormatGenre = (item: Album | AlbumArtist | Song) => {
    const genreRoute = useGenreRoute();

    return item.genres?.map((genre, index) => (
        <span key={genre.id}>
            {index > 0 && <Separator />}
            <Text
                $link
                component={Link}
                overflow="visible"
                size="md"
                to={genre.id ? generatePath(genreRoute, { genreId: genre.id }) : ''}
                weight={500}
            >
                {genre.name || '—'}
            </Text>
        </span>
    ));
};

const BoolField = (key: boolean) =>
    key ? <RiCheckFill size="1.1rem" /> : <RiCloseFill size="1.1rem" />;

const AlbumPropertyMapping: ItemDetailRow<Album>[] = [
    { key: 'name', label: 'common.title' },
    { label: 'entity.albumArtist_one', render: (item) => formatArtists(item.albumArtists) },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (album) => album.duration && formatDurationString(album.duration),
    },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    { key: 'catalogNumber', label: 'common.catalogNumber' },
    { key: 'songCount', label: 'filter.songCount' },
    { label: 'filter.isCompilation', render: (album) => BoolField(album.isCompilation || false) },
    {
        key: 'size',
        label: 'common.size',
        render: (album) => album.size && formatSizeString(album.size),
    },
    {
        label: 'common.favorite',
        render: (album) => BoolField(album.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDateRelative(song.updatedAt),
    },
    { label: 'filter.comment', render: formatComment },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (album) =>
            album.mbzId ? (
                <a
                    href={`https://musicbrainz.org/release/${album.mbzId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {album.mbzId}
                </a>
            ) : null,
    },
];

const AlbumArtistPropertyMapping: ItemDetailRow<AlbumArtist>[] = [
    { key: 'name', label: 'common.name' },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (artist) => artist.duration && formatDurationString(artist.duration),
    },
    { key: 'songCount', label: 'filter.songCount' },
    {
        label: 'common.favorite',
        render: (artist) => BoolField(artist.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.mbid',
        postprocess: [],
        render: (artist) =>
            artist.mbz ? (
                <a
                    href={`https://musicbrainz.org/artist/${artist.mbz}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {artist.mbz}
                </a>
            ) : null,
    },
    {
        label: 'common.biography',
        render: (artist) =>
            artist.biography ? (
                <Spoiler
                    dangerouslySetInnerHTML={{ __html: sanitize(artist.biography) }}
                    maxHeight={50}
                />
            ) : null,
    },
];

const SongPropertyMapping: ItemDetailRow<Song>[] = [
    { key: 'name', label: 'common.title' },
    { key: 'path', label: 'common.path', render: SongPath },
    { label: 'entity.albumArtist_one', render: (item) => formatArtists(item.albumArtists) },
    { key: 'artists', label: 'entity.artist_other', render: (item) => formatArtists(item.artists) },
    {
        key: 'album',
        label: 'entity.album_one',
        render: (song) =>
            song.albumId &&
            song.album && (
                <Text
                    $link
                    component={Link}
                    overflow="visible"
                    size="md"
                    to={
                        song.albumId
                            ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                  albumId: song.albumId,
                              })
                            : ''
                    }
                    weight={500}
                >
                    {song.album}
                </Text>
            ),
    },
    { key: 'discNumber', label: 'common.disc' },
    { key: 'trackNumber', label: 'common.trackNumber' },
    { key: 'releaseYear', label: 'filter.releaseYear' },
    {
        label: 'common.catalogNumber',
        render: (song) => {
            if (!song.tags) return null;

            // Look for catalog number in various tag fields
            const catalogValue =
                song.tags.catalognumber?.[0] ||
                song.tags.CATALOGNUMBER?.[0] ||
                song.tags.catalogNumber?.[0] ||
                song.tags.CATALOGNUMBER?.[0] ||
                song.tags.labelno?.[0] ||
                song.tags.LABELNO?.[0] ||
                undefined;

            return catalogValue || null;
        },
    },
    { label: 'entity.genre_other', render: FormatGenre },
    {
        label: 'common.duration',
        render: (song) => formatDurationString(song.duration),
    },
    {
        label: 'common.key',
        render: (song) => {
            if (!song.tags) {
                return null;
            }

            // Extract key using same logic as table column
            const rawKeyValue =
                song.tags.initialkey?.[0] ||
                song.tags.key?.[0] ||
                song.tags.INITIALKEY?.[0] ||
                song.tags.KEY?.[0] ||
                song.tags.musickey?.[0] ||
                song.tags.MUSICKEY?.[0] ||
                undefined;

            if (rawKeyValue) {
                // Try to decode if it looks like base64 JSON
                if (rawKeyValue.length > 20 && !rawKeyValue.includes(' ')) {
                    try {
                        const decoded = atob(rawKeyValue);
                        const parsed = JSON.parse(decoded);
                        if (parsed.key) {
                            return parsed.key;
                        }
                    } catch (e) {
                        // Failed to decode, fall through to use raw value
                    }
                }

                // If it's already a simple key format, use it directly
                if (rawKeyValue.match(/^[0-9]{0,2}[A-G][#b]?[m]?$/)) {
                    return rawKeyValue;
                }

                return rawKeyValue;
            }

            return null;
        },
    },
    { key: 'bpm', label: 'common.bpm' },
    {
        label: 'common.energyLevel',
        render: (song) => {
            if (!song.tags) return null;

            // Extract energy level from various tag fields
            const energyValue =
                song.tags.energylevel?.[0] ||
                song.tags.ENERGYLEVEL?.[0] ||
                song.tags.energy?.[0] ||
                song.tags.ENERGY?.[0] ||
                undefined;

            if (energyValue) {
                // Try to decode if it looks like base64 JSON (Mixed In Key format)
                if (energyValue.length > 20 && !energyValue.includes(' ')) {
                    try {
                        const decoded = atob(energyValue);
                        const parsed = JSON.parse(decoded);
                        if (parsed.energy !== undefined) {
                            return parsed.energy;
                        }
                        if (parsed.energyLevel !== undefined) {
                            return parsed.energyLevel;
                        }
                    } catch (e) {
                        // Failed to decode, fall through to use raw value
                    }
                }

                // Try to parse as integer
                const parsed = parseInt(energyValue, 10);
                return !isNaN(parsed) ? parsed : null;
            }

            return null;
        },
    },
    {
        label: 'entity.label_one',
        render: (song) => {
            if (!song.tags) return null;

            // Look for label in various tag fields
            const labelValue =
                song.tags.label?.[0] ||
                song.tags.LABEL?.[0] ||
                song.tags.recordlabel?.[0] ||
                song.tags.RECORDLABEL?.[0] ||
                song.tags.publisher?.[0] ||
                song.tags.PUBLISHER?.[0] ||
                undefined;

            return labelValue || null;
        },
    },
    { label: 'filter.isCompilation', render: (song) => BoolField(song.compilation || false) },
    { key: 'container', label: 'common.codec' },
    { key: 'bitRate', label: 'common.bitrate', render: (song) => `${song.bitRate} kbps` },
    { key: 'channels', label: 'common.channel_other' },
    { key: 'size', label: 'common.size', render: (song) => formatSizeString(song.size) },
    {
        label: 'common.favorite',
        render: (song) => BoolField(song.userFavorite),
    },
    { label: 'common.rating', render: formatRating },
    { key: 'playCount', label: 'filter.playCount' },
    {
        label: 'filter.lastPlayed',
        render: (song) => formatDateRelative(song.lastPlayedAt),
    },
    {
        label: 'common.modified',
        render: (song) => formatDateRelative(song.updatedAt),
    },
    {
        label: 'common.albumGain',
        render: (song) => (song.gain?.album !== undefined ? `${song.gain.album} dB` : null),
    },
    {
        label: 'common.trackGain',
        render: (song) => (song.gain?.track !== undefined ? `${song.gain.track} dB` : null),
    },
    {
        label: 'common.albumPeak',
        render: (song) => (song.peak?.album !== undefined ? `${song.peak.album}` : null),
    },
    {
        label: 'common.trackPeak',
        render: (song) => (song.peak?.track !== undefined ? `${song.peak.track}` : null),
    },
    { label: 'filter.comment', render: formatComment },
];

const handleTags = (item: Album | Song, t: TFunction) => {
    if (item.tags) {
        const tags = Object.entries(item.tags).map(([tag, fields]) => {
            return (
                <tr key={tag}>
                    <td>
                        {tag.slice(0, 1).toLocaleUpperCase()}
                        {tag.slice(1)}
                    </td>
                    <td>{fields.length === 0 ? BoolField(true) : fields.join(SEPARATOR_STRING)}</td>
                </tr>
            );
        });

        if (tags.length) {
            return [
                <tr key="tags">
                    <td>
                        <h3>{t('common.tags', { postProcess: 'sentenceCase' })}</h3>
                    </td>
                    <td>
                        <h3>{tags.length}</h3>
                    </td>
                </tr>,
            ].concat(tags);
        }
    }

    return [];
};

const handleParticipants = (item: Album | Song, t: TFunction) => {
    if (item.participants) {
        const participants = Object.entries(item.participants).map(([role, participants]) => {
            return (
                <tr key={role}>
                    <td>
                        {role.slice(0, 1).toLocaleUpperCase()}
                        {role.slice(1)}
                    </td>
                    <td>{formatArtists(participants)}</td>
                </tr>
            );
        });

        if (participants.length) {
            return [
                <tr key="participants">
                    <td>
                        <h3>
                            {t('common.additionalParticipants', {
                                postProcess: 'sentenceCase',
                            })}
                        </h3>
                    </td>
                    <td>
                        <h3>{participants.length}</h3>
                    </td>
                </tr>,
            ].concat(participants);
        }
    }

    return [];
};

const ItemDetailsModalContent = ({ item }: ItemDetailsModalProps) => {
    const { t } = useTranslation();
    let body: ReactNode[] = [];

    switch (item.itemType) {
        case LibraryItem.ALBUM:
            body = AlbumPropertyMapping.map((rule) => handleRow(t, item, rule));
            body.push(...handleParticipants(item, t));
            body.push(...handleTags(item, t));
            break;
        case LibraryItem.ALBUM_ARTIST:
            body = AlbumArtistPropertyMapping.map((rule) => handleRow(t, item, rule));
            break;
        case LibraryItem.SONG:
            body = SongPropertyMapping.map((rule) => handleRow(t, item, rule));
            body.push(...handleParticipants(item, t));
            body.push(...handleTags(item, t));
            break;
        default:
            body = [];
    }

    return (
        <Group>
            <Table
                highlightOnHover
                horizontalSpacing="sm"
                sx={{ userSelect: 'text' }}
                verticalSpacing="sm"
            >
                <tbody>{body}</tbody>
            </Table>
        </Group>
    );
};

export const ItemDetailsModal = ({ item }: ItemDetailsModalProps) => {
    const server = useCurrentServer();

    // For songs, fetch full details with tags if tags are missing
    const songDetailQuery = useQuery({
        enabled: item.itemType === LibraryItem.SONG && !item.tags && !!server,
        queryFn: async ({ signal }) => {
            if (!server) throw new Error('No server available');

            return api.controller.getSongDetail({
                apiClientProps: { server, signal },
                query: { id: item.id },
            });
        },
        queryKey: ['songDetail', item.id, server?.id],
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Use detailed song data if available, otherwise use the original item
    const itemToDisplay = songDetailQuery.data || item;

    // Show loading spinner while fetching song details
    if (item.itemType === LibraryItem.SONG && !item.tags && songDetailQuery.isLoading) {
        return (
            <Group
                p="xl"
                position="center"
            >
                <Spinner />
            </Group>
        );
    }

    return <ItemDetailsModalContent item={itemToDisplay} />;
};

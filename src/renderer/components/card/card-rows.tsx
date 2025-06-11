import formatDuration from 'format-duration';
import React from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { Text } from '/@/renderer/components/text';
import { LabelAggregationService } from '/@/renderer/features/labels/services/label-aggregation';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDateAbsolute, formatDateRelative, formatRating } from '/@/renderer/utils/format';
import { Album, AlbumArtist, Artist, Playlist, Song } from '/@/shared/types/domain-types';
import { CardRow } from '/@/shared/types/types';

const Row = styled.div<{ $secondary?: boolean }>`
    width: 100%;
    max-width: 100%;
    height: 22px;
    padding: 0 0.2rem;
    overflow: hidden;
    color: ${({ $secondary }) => ($secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
`;

interface CardRowsProps {
    data: any;
    rows: CardRow<Album>[] | CardRow<AlbumArtist>[] | CardRow<Artist>[];
}

export const CardRows = ({ data, rows }: CardRowsProps) => {
    return (
        <>
            {rows.map((row, index: number) => {
                if (row.arrayProperty && row.route) {
                    return (
                        <Row
                            $secondary={index > 0}
                            key={`row-${row.property}-${index}`}
                        >
                            {data[row.property].map((item: any, itemIndex: number) => (
                                <React.Fragment key={`${data.id}-${item.id}`}>
                                    {itemIndex > 0 && (
                                        <Text
                                            $noSelect
                                            $secondary
                                            sx={{
                                                display: 'inline-block',
                                                padding: '0 2px 0 1px',
                                            }}
                                        >
                                            ,
                                        </Text>
                                    )}{' '}
                                    <Text
                                        $link
                                        $noSelect
                                        $secondary={index > 0}
                                        component={Link}
                                        onClick={(e) => e.stopPropagation()}
                                        overflow="hidden"
                                        size={index > 0 ? 'sm' : 'md'}
                                        to={generatePath(
                                            row.route!.route,
                                            row.route!.slugs?.reduce((acc, slug) => {
                                                return {
                                                    ...acc,
                                                    [slug.slugProperty]:
                                                        data[row.property][itemIndex][
                                                            slug.idProperty
                                                        ],
                                                };
                                            }, {}),
                                        )}
                                    >
                                        {row.arrayProperty &&
                                            (row.format
                                                ? row.format(item)
                                                : item[row.arrayProperty])}
                                    </Text>
                                </React.Fragment>
                            ))}
                        </Row>
                    );
                }

                if (row.arrayProperty) {
                    return (
                        <Row key={`row-${row.property}`}>
                            {data[row.property].map((item: any) => (
                                <Text
                                    $noSelect
                                    $secondary={index > 0}
                                    key={`${data.id}-${item.id}`}
                                    overflow="hidden"
                                    size={index > 0 ? 'sm' : 'md'}
                                >
                                    {row.arrayProperty &&
                                        (row.format ? row.format(item) : item[row.arrayProperty])}
                                </Text>
                            ))}
                        </Row>
                    );
                }

                // Get the display value for this row
                const displayValue = row.format ? row.format(data) : data[row.property];

                // Don't render rows with no value, but always render if there's a format function
                if (!displayValue && displayValue !== 0 && !row.format) {
                    return null;
                }

                return (
                    <Row key={`row-${row.property}`}>
                        {row.route ? (
                            <Text
                                $link
                                $noSelect
                                component={Link}
                                onClick={(e) => e.stopPropagation()}
                                overflow="hidden"
                                to={generatePath(
                                    row.route.route,
                                    row.route.slugs?.reduce((acc, slug) => {
                                        // Special handling for label routes
                                        if (
                                            row.property === 'tags' &&
                                            slug.slugProperty === 'labelId'
                                        ) {
                                            const label =
                                                LabelAggregationService.getAlbumLabel(data);
                                            return {
                                                ...acc,
                                                [slug.slugProperty]: label
                                                    ? LabelAggregationService.createLabelId(label)
                                                    : '',
                                            };
                                        }
                                        return {
                                            ...acc,
                                            [slug.slugProperty]: data[slug.idProperty],
                                        };
                                    }, {}),
                                )}
                            >
                                {displayValue}
                            </Text>
                        ) : row.formatLink ? (
                            <Text
                                $link
                                $noSelect
                                component="a"
                                href={row.formatLink(data)}
                                onClick={(e) => e.stopPropagation()}
                                overflow="hidden"
                                rel="noopener noreferrer"
                                size={index > 0 ? 'sm' : 'md'}
                                target="_blank"
                            >
                                {displayValue}
                            </Text>
                        ) : (
                            <Text
                                $noSelect
                                $secondary={index > 0}
                                overflow="hidden"
                                size={index > 0 ? 'sm' : 'md'}
                            >
                                {displayValue}
                            </Text>
                        )}
                    </Row>
                );
            })}
        </>
    );
};

export const ALBUM_CARD_ROWS: { [key: string]: CardRow<Album> } = {
    albumArtists: {
        arrayProperty: 'name',
        property: 'albumArtists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    artists: {
        arrayProperty: 'name',
        property: 'artists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    catalogNumber: {
        property: 'catalogNumber',
    },
    catalogNumberAlways: {
        format: (album) => {
            // Handle null, undefined, empty string, or whitespace-only values
            if (
                !album.catalogNumber ||
                (typeof album.catalogNumber === 'string' && !album.catalogNumber.trim())
            ) {
                return '—';
            }
            return String(album.catalogNumber).trim();
        },
        formatLink: (album) => {
            // Only create link if catalogNumber exists and is not the placeholder
            if (
                !album.catalogNumber ||
                (typeof album.catalogNumber === 'string' && !album.catalogNumber.trim())
            ) {
                return undefined;
            }

            const catalogNumber = String(album.catalogNumber).trim();
            const albumLabel = LabelAggregationService.getAlbumLabel(album);
            const searchQuery = albumLabel ? `${albumLabel} ${catalogNumber}` : catalogNumber;

            return `https://www.discogs.com/search?q=${encodeURIComponent(searchQuery)}&type=release&layout=med`;
        },
        property: 'catalogNumber',
    },
    createdAt: {
        format: (album) => formatDateAbsolute(album.createdAt),
        property: 'createdAt',
    },
    duration: {
        format: (album) => (album.duration === null ? null : formatDuration(album.duration)),
        property: 'duration',
    },
    label: {
        format: (album) => LabelAggregationService.getAlbumLabel(album),
        property: 'tags',
        route: {
            route: AppRoute.LIBRARY_LABELS_DETAIL,
            slugs: [
                {
                    idProperty: 'id',
                    slugProperty: 'labelId',
                },
            ],
        },
    },
    lastPlayedAt: {
        format: (album) => formatDateRelative(album.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (album) => formatRating(album),
        property: 'userRating',
    },
    releaseDate: {
        property: 'releaseDate',
    },
    releaseYear: {
        property: 'releaseYear',
    },
    songCount: {
        property: 'songCount',
    },
};

export const SONG_CARD_ROWS: { [key: string]: CardRow<Song> } = {
    album: {
        property: 'album',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
        },
    },
    albumArtists: {
        arrayProperty: 'name',
        property: 'albumArtists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    artists: {
        arrayProperty: 'name',
        property: 'artists',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    createdAt: {
        format: (song) => formatDateAbsolute(song.createdAt),
        property: 'createdAt',
    },
    duration: {
        format: (song) => (song.duration === null ? null : formatDuration(song.duration)),
        property: 'duration',
    },
    lastPlayedAt: {
        format: (song) => formatDateRelative(song.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (song) => formatRating(song),
        property: 'userRating',
    },
    releaseDate: {
        property: 'releaseDate',
    },
    releaseYear: {
        property: 'releaseYear',
    },
};

export const ALBUMARTIST_CARD_ROWS: { [key: string]: CardRow<AlbumArtist> } = {
    albumCount: {
        property: 'albumCount',
    },
    duration: {
        format: (artist) => (artist.duration === null ? null : formatDuration(artist.duration)),
        property: 'duration',
    },
    genres: {
        property: 'genres',
    },
    lastPlayedAt: {
        format: (artist) => formatDateRelative(artist.lastPlayedAt),
        property: 'lastPlayedAt',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
    },
    playCount: {
        property: 'playCount',
    },
    rating: {
        format: (artist) => formatRating(artist),
        property: 'userRating',
    },
    songCount: {
        property: 'songCount',
    },
};

export const PLAYLIST_CARD_ROWS: { [key: string]: CardRow<Playlist> } = {
    duration: {
        format: (playlist) =>
            playlist.duration === null ? null : formatDuration(playlist.duration),
        property: 'duration',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.PLAYLISTS_DETAIL_SONGS,
            slugs: [{ idProperty: 'id', slugProperty: 'playlistId' }],
        },
    },
    nameFull: {
        property: 'name',
        route: {
            route: AppRoute.PLAYLISTS_DETAIL_SONGS,
            slugs: [{ idProperty: 'id', slugProperty: 'playlistId' }],
        },
    },
    owner: {
        property: 'owner',
    },
    public: {
        property: 'public',
    },
    songCount: {
        property: 'songCount',
    },
};

export const LABEL_CARD_ROWS: { [key: string]: CardRow<any> } = {
    albumCount: {
        property: 'albumCount',
    },
    name: {
        property: 'name',
        route: {
            route: AppRoute.LIBRARY_LABELS_DETAIL,
            slugs: [{ idProperty: 'id', slugProperty: 'labelId' }],
        },
    },
};

export const YEAR_CARD_ROWS: { [key: string]: CardRow<any> } = {
    albumCount: {
        format: (year) => {
            const count = year.albumCount;
            if (count === undefined || count === null) return '';
            return count === 1 ? '1 album' : `${count} albums`;
        },
        property: 'albumCount',
    },
    name: {
        property: 'displayName',
        // Note: Route will be handled by the card component since decades and years have different routes
    },
    type: {
        format: (year) => (year.type === 'decade' ? 'Decade' : 'Year'),
        property: 'type',
    },
};

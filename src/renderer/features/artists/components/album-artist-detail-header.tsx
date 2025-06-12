import { Group, Rating, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { createSearchParams, Link } from 'react-router-dom';

import { Text } from '/@/renderer/components';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface AlbumArtistDetailHeaderProps {
    background: string;
}

export const AlbumArtistDetailHeader = forwardRef(
    ({ background }: AlbumArtistDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumArtistId, artistId } = useParams() as {
            albumArtistId?: string;
            artistId?: string;
        };
        const routeId = (artistId || albumArtistId) as string;
        const server = useCurrentServer();
        const { t } = useTranslation();
        const detailQuery = useAlbumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        });

        const albumCount = detailQuery?.data?.albumCount;
        const songCount = detailQuery?.data?.songCount;
        const duration = detailQuery?.data?.duration;
        const durationEnabled = duration !== null && duration !== undefined;

        // Create the same links used by the VIEW DISCOGRAPHY and VIEW ALL TRACKS buttons
        const artistDiscographyLink = `${generatePath(
            AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY,
            {
                albumArtistId: routeId,
            },
        )}?${createSearchParams({
            artistId: routeId,
            artistName: detailQuery?.data?.name || '',
        })}`;

        const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
            albumArtistId: routeId,
        })}?${createSearchParams({
            artistId: routeId,
            artistName: detailQuery?.data?.name || '',
        })}`;

        const metadataItems = [
            {
                enabled: albumCount !== null && albumCount !== undefined,
                id: 'albumCount',
                secondary: false,
                value: (
                    <Text
                        $link
                        component={Link}
                        to={artistDiscographyLink}
                    >
                        {t('entity.albumWithCount', { count: albumCount || 0 })}
                    </Text>
                ),
            },
            {
                enabled: songCount !== null && songCount !== undefined,
                id: 'songCount',
                secondary: false,
                value: (
                    <Text
                        $link
                        component={Link}
                        to={artistSongsLink}
                    >
                        {t('entity.trackWithCount', { count: songCount || 0 })}
                    </Text>
                ),
            },
            {
                enabled: durationEnabled,
                id: 'duration',
                secondary: true,
                value: durationEnabled && formatDurationString(duration),
            },
        ];

        const updateRatingMutation = useSetRating({});

        const handleUpdateRating = (rating: number) => {
            if (!detailQuery?.data) return;

            updateRatingMutation.mutate({
                query: {
                    item: [detailQuery.data],
                    rating,
                },
                serverId: detailQuery?.data.serverId,
            });
        };

        const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

        return (
            <LibraryHeader
                background={background}
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
                ref={ref}
                title={detailQuery?.data?.name || ''}
            >
                <Stack>
                    <Group>
                        {metadataItems
                            .filter((i) => i.enabled)
                            .map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text $noSelect>•</Text>}
                                    {typeof item.value === 'string' ? (
                                        <Text $secondary={item.secondary}>{item.value}</Text>
                                    ) : (
                                        item.value
                                    )}
                                </Fragment>
                            ))}
                        {showRating && (
                            <>
                                <Text $noSelect>•</Text>
                                <Rating
                                    onChange={handleUpdateRating}
                                    readOnly={
                                        detailQuery?.isFetching || updateRatingMutation.isLoading
                                    }
                                    value={detailQuery?.data?.userRating || 0}
                                />
                            </>
                        )}
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);

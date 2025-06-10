import { Group, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '/@/renderer/components/text';
import { LibraryHeader } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { Album, LibraryItem } from '/@/shared/types/domain-types';

interface YearDetailHeaderProps {
    albumCount?: number;
    albums?: Album[];
    background?: string;
    yearValue: string;
}

export const YearDetailHeader = forwardRef<HTMLDivElement, YearDetailHeaderProps>(
    ({ albumCount, albums = [], background, yearValue }, ref: Ref<HTMLDivElement>) => {
        const { t } = useTranslation();

        const totalDuration = albums.reduce((sum, album) => sum + (album.duration || 0), 0);
        const totalSongs = albums.reduce((sum, album) => sum + (album.songCount || 0), 0);
        const durationEnabled = totalDuration > 0;
        const finalAlbumCount = albumCount || albums.length;

        const metadataItems = [
            {
                enabled: finalAlbumCount > 0,
                id: 'albumCount',
                secondary: false,
                value: t('entity.albumWithCount', { count: finalAlbumCount }),
            },
            {
                enabled: totalSongs > 0,
                id: 'songCount',
                secondary: false,
                value: t('entity.trackWithCount', { count: totalSongs }),
            },
            {
                enabled: durationEnabled,
                id: 'duration',
                secondary: true,
                value: durationEnabled ? formatDurationString(totalDuration) : '',
            },
        ];

        return (
            <LibraryHeader
                background={background || 'var(--card-default-bg)'}
                imageUrl={null}
                item={{ route: AppRoute.LIBRARY_YEARS, type: LibraryItem.YEAR }}
                ref={ref}
                title={yearValue}
            >
                <Stack>
                    <Group>
                        {metadataItems
                            .filter((i) => i.enabled)
                            .map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text $noSelect>•</Text>}
                                    <Text $secondary={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);

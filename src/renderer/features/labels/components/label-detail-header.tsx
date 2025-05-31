import { Group, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Label } from '../services/label-aggregation';

import { Text } from '/@/renderer/components/text';
import { LibraryHeader } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { LibraryItem } from '/@/shared/types/domain-types';

interface LabelDetailHeaderProps {
    background?: string;
    label: Label;
}

export const LabelDetailHeader = forwardRef<HTMLDivElement, LabelDetailHeaderProps>(
    ({ background, label }, ref: Ref<HTMLDivElement>) => {
        const { t } = useTranslation();

        const albumCount = label.albumCount;
        const totalDuration = label.albums.reduce((sum, album) => sum + (album.duration || 0), 0);
        const totalSongs = label.albums.reduce((sum, album) => sum + (album.songCount || 0), 0);
        const durationEnabled = totalDuration > 0;

        // Generate a placeholder image URL or use a label icon
        const labelImageUrl = null; // Labels typically don't have images

        const metadataItems = [
            {
                enabled: albumCount > 0,
                id: 'albumCount',
                secondary: false,
                value: t('entity.albumWithCount', { count: albumCount }),
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
                imageUrl={labelImageUrl}
                item={{ route: AppRoute.LIBRARY_LABELS, type: LibraryItem.LABEL }}
                ref={ref}
                title={label.name}
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

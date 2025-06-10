import { Group, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { TimeNavigation } from './time-navigation';

import { Text } from '/@/renderer/components/text';
import { LibraryHeader } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

const NavigationContainer = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
`;

interface TimeDetailHeaderProps {
    background?: string;
    songCount?: number;
    songs?: Song[];
    timeValue: string;
}

export const TimeDetailHeader = forwardRef<HTMLDivElement, TimeDetailHeaderProps>(
    ({ background, songCount, songs = [], timeValue }, ref: Ref<HTMLDivElement>) => {
        const { t } = useTranslation();
        const { timeId } = useParams() as { timeId: string };

        const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
        const durationEnabled = totalDuration > 0;
        const finalSongCount = songCount || songs.length;

        const metadataItems = [
            {
                enabled: finalSongCount > 0,
                id: 'songCount',
                secondary: false,
                value: t('entity.trackWithCount', { count: finalSongCount }),
            },
            {
                enabled: durationEnabled,
                id: 'duration',
                secondary: true,
                value: durationEnabled ? formatDurationString(totalDuration) : '',
            },
        ];

        return (
            <div style={{ position: 'relative' }}>
                <LibraryHeader
                    background={background || 'var(--card-default-bg)'}
                    imageUrl={null}
                    item={{ route: AppRoute.LIBRARY_TIME, type: LibraryItem.TIME }}
                    ref={ref}
                    title={timeValue}
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
                <NavigationContainer>
                    <TimeNavigation currentTimeId={timeId} />
                </NavigationContainer>
            </div>
        );
    },
);

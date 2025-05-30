import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Stack } from '@mantine/core';
import { useRef } from 'react';

import { PlayQueueListControls } from './play-queue-list-controls';

import { PageHeader, Paper } from '/@/renderer/components';
import { VirtualGridContainer } from '/@/renderer/components/virtual-grid';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Song } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export const SidebarPlayQueue = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
    const { windowBarStyle } = useWindowSettings();

    const isWeb = windowBarStyle === Platform.WEB;
    return (
        <VirtualGridContainer>
            {isWeb && (
                <Stack mr={isWeb ? '130px' : undefined}>
                    <PageHeader backgroundColor="var(--titlebar-bg)" />
                </Stack>
            )}
            <Paper
                display={!isWeb ? 'flex' : undefined}
                h={!isWeb ? '65px' : undefined}
            >
                <PlayQueueListControls
                    tableRef={queueRef}
                    type="sideQueue"
                />
            </Paper>
            <PlayQueue
                ref={queueRef}
                type="sideQueue"
            />
        </VirtualGridContainer>
    );
};

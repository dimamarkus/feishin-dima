import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Box, Flex } from '@mantine/core';
import { useRef } from 'react';

import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { Song } from '/@/shared/types/domain-types';

export const DrawerPlayQueue = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);

    return (
        <Flex
            direction="column"
            h="100%"
        >
            <Box
                bg="var(--main-bg)"
                sx={{ borderRadius: '10px' }}
            >
                <PlayQueueListControls
                    tableRef={queueRef}
                    type="sideQueue"
                />
            </Box>
            <Flex
                bg="var(--main-bg)"
                h="100%"
                mb="0.6rem"
            >
                <PlayQueue
                    ref={queueRef}
                    type="sideQueue"
                />
            </Flex>
        </Flex>
    );
};

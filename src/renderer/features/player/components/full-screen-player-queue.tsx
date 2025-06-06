import { Group } from '@mantine/core';
import { motion } from 'framer-motion';
import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineQueueList } from 'react-icons/hi2';
import { RiFileMusicLine, RiFileTextLine } from 'react-icons/ri';
import styled from 'styled-components';

import { Button } from '/@/renderer/components';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import { usePlaybackSettings } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { PlaybackType } from '/@/shared/types/types';

const Visualizer = lazy(() =>
    import('/@/renderer/features/player/components/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const QueueContainer = styled.div`
    position: relative;
    display: flex;
    height: 100%;

    .ag-theme-alpine-dark {
        --ag-header-background-color: rgb(0 0 0 / 0%) !important;
        --ag-background-color: rgb(0 0 0 / 0%) !important;
        --ag-odd-row-background-color: rgb(0 0 0 / 0%) !important;
    }

    .ag-header {
        display: none !important;
    }
`;

const ActiveTabIndicator = styled(motion.div)`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--main-fg);
`;

const HeaderItemWrapper = styled.div`
    position: relative;
    z-index: 2;
`;

interface TransparentGridContainerProps {
    opacity: number;
}

const GridContainer = styled.div<TransparentGridContainerProps>`
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
    padding: 1rem;
    /* stylelint-disable-next-line color-function-notation */
    background: rgb(var(--main-bg-transparent), ${({ opacity }) => opacity}%);
    border-radius: 5px;
`;

export const FullScreenPlayerQueue = () => {
    const { t } = useTranslation();
    const { activeTab, opacity } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { type, webAudio } = usePlaybackSettings();

    const headerItems = useMemo(() => {
        const items = [
            {
                active: activeTab === 'queue',
                icon: <RiFileMusicLine size="1.5rem" />,
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => setStore({ activeTab: 'queue' }),
            },
            {
                active: activeTab === 'related',
                icon: <HiOutlineQueueList size="1.5rem" />,
                label: t('page.fullscreenPlayer.related'),
                onClick: () => setStore({ activeTab: 'related' }),
            },
            {
                active: activeTab === 'lyrics',
                icon: <RiFileTextLine size="1.5rem" />,
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => setStore({ activeTab: 'lyrics' }),
            },
        ];

        if (type === PlaybackType.WEB && webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                icon: <RiFileTextLine size="1.5rem" />,
                label: t('page.fullscreenPlayer.visualizer', { postProcess: 'titleCase' }),
                onClick: () => setStore({ activeTab: 'visualizer' }),
            });
        }

        return items;
    }, [activeTab, setStore, t, type, webAudio]);

    return (
        <GridContainer
            className="full-screen-player-queue-container"
            opacity={opacity}
        >
            <Group
                align="center"
                className="full-screen-player-queue-header"
                grow
                position="center"
            >
                {headerItems.map((item) => (
                    <HeaderItemWrapper key={`tab-${item.label}`}>
                        <Button
                            fullWidth
                            fw="600"
                            onClick={item.onClick}
                            pos="relative"
                            size="lg"
                            sx={{
                                alignItems: 'center',
                                color: item.active
                                    ? 'var(--main-fg) !important'
                                    : 'var(--main-fg-secondary) !important',
                                letterSpacing: '1px',
                            }}
                            uppercase
                            variant="subtle"
                        >
                            {item.label}
                        </Button>
                        {item.active ? <ActiveTabIndicator layoutId="underline" /> : null}
                    </HeaderItemWrapper>
                ))}
            </Group>
            {activeTab === 'queue' ? (
                <QueueContainer>
                    <PlayQueue type="fullScreen" />
                </QueueContainer>
            ) : activeTab === 'related' ? (
                <QueueContainer>
                    <FullScreenSimilarSongs />
                </QueueContainer>
            ) : activeTab === 'lyrics' ? (
                <Lyrics />
            ) : activeTab === 'visualizer' && type === PlaybackType.WEB && webAudio ? (
                <Suspense fallback={<></>}>
                    <Visualizer />
                </Suspense>
            ) : null}
        </GridContainer>
    );
};

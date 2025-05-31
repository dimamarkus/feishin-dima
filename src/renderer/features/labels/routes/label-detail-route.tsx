import { useRef } from 'react';
import { useParams } from 'react-router-dom';

import { LabelDetailContent } from '../components/label-detail-content';
import { useLabelDetail } from '../queries/label-detail-query';

import { NativeScrollArea } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/shared/types/domain-types';

const LabelDetailRoute = () => {
    const { labelId } = useParams() as { labelId: string };
    const server = useCurrentServer();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const labelQuery = useLabelDetail({
        labelId,
        serverId: server?.id,
    });

    // Since labels don't have images, use a default background
    const background = 'var(--placeholder-bg)';

    const handlePlay = () => {
        if (!labelQuery.data?.albums.length) return;

        const albumIds = labelQuery.data.albums.map((album) => album.id);
        handlePlayQueueAdd?.({
            byItemType: {
                id: albumIds,
                type: LibraryItem.ALBUM,
            },
            playType: playButtonBehavior,
        });
    };

    return (
        <AnimatedPage key={`label-detail-${labelId}`}>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: background,
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.PlayButton onClick={handlePlay} />
                            <LibraryHeaderBar.Title>
                                {labelQuery?.data?.name}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                    target: headerRef,
                }}
                ref={scrollAreaRef}
            >
                <LabelDetailContent
                    background={background}
                    error={labelQuery.error ? String(labelQuery.error) : null}
                    headerRef={headerRef}
                    isLoading={labelQuery.isLoading}
                    label={labelQuery.data || null}
                />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default LabelDetailRoute;

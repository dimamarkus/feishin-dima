import { MouseEvent, useCallback } from 'react';
import styled from 'styled-components';

import { AudioPlayer } from '/@/renderer/components';
import { CenterControls } from '/@/renderer/features/player/components/center-controls';
import { LeftControls } from '/@/renderer/features/player/components/left-controls';
import { RightControls } from '/@/renderer/features/player/components/right-controls';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import {
    useCurrentPlayer,
    useCurrentStatus,
    useFullScreenPlayerStore,
    useMuted,
    usePlayer1Data,
    usePlayer2Data,
    usePlayerControls,
    useSetFullScreenPlayerStore,
    useVolume,
} from '/@/renderer/store';
import {
    useGeneralSettings,
    usePlaybackType,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { PlaybackType } from '/@/shared/types/types';

const PlayerbarContainer = styled.div`
    width: 100vw;
    height: 100%;
    border-top: var(--playerbar-border-top);
`;

const PlayerbarControlsGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    height: 100%;

    @media (width <= 768px) {
        grid-template-columns: minmax(0, 0.5fr) minmax(0, 1fr) minmax(0, 0.5fr);
    }
`;

const RightGridItem = styled.div`
    align-self: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const LeftGridItem = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const CenterGridItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

export const Playerbar = () => {
    const playersRef = PlayersRef;
    const settings = useSettingsStore((state) => state.playback);
    const { playerbarOpenDrawer } = useGeneralSettings();
    const playbackType = usePlaybackType();
    const volume = useVolume();
    const player1 = usePlayer1Data();
    const player2 = usePlayer2Data();
    const status = useCurrentStatus();
    const player = useCurrentPlayer();
    const muted = useMuted();
    const { autoNext } = usePlayerControls();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const autoNextFn = useCallback(() => {
        const playerData = autoNext();
        updateSong(playerData.current.song);
    }, [autoNext]);

    return (
        <PlayerbarContainer
            onClick={playerbarOpenDrawer ? handleToggleFullScreenPlayer : undefined}
        >
            <PlayerbarControlsGrid>
                <LeftGridItem>
                    <LeftControls />
                </LeftGridItem>
                <CenterGridItem>
                    <CenterControls playersRef={playersRef} />
                </CenterGridItem>
                <RightGridItem>
                    <RightControls />
                </RightGridItem>
            </PlayerbarControlsGrid>
            {playbackType === PlaybackType.WEB && (
                <AudioPlayer
                    autoNext={autoNextFn}
                    crossfadeDuration={settings.crossfadeDuration}
                    crossfadeStyle={settings.crossfadeStyle}
                    currentPlayer={player}
                    muted={muted}
                    playbackStyle={settings.style}
                    player1={player1}
                    player2={player2}
                    ref={playersRef}
                    status={status}
                    style={settings.style as any}
                    volume={(volume / 100) ** 2}
                />
            )}
        </PlayerbarContainer>
    );
};

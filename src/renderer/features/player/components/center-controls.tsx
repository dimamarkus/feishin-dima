import { useHotkeys } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import formatDuration from 'format-duration';
import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsDice3 } from 'react-icons/bs';
import { IoIosPause } from 'react-icons/io';
import {
    RiPlayFill,
    RiRepeat2Line,
    RiRepeatOneLine,
    RiRewindFill,
    RiShuffleFill,
    RiSkipBackFill,
    RiSkipForwardFill,
    RiSpeedFill,
    RiStopFill,
} from 'react-icons/ri';
import styled from 'styled-components';

import { Text } from '/@/renderer/components';
import { PlayerButton } from '/@/renderer/features/player/components/player-button';
import { PlayerbarSlider } from '/@/renderer/features/player/components/playerbar-slider';
import { openShuffleAllModal } from '/@/renderer/features/player/components/shuffle-all-modal';
import { useCenterControls } from '/@/renderer/features/player/hooks/use-center-controls';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import {
    useCurrentPlayer,
    useCurrentSong,
    useCurrentStatus,
    useCurrentTime,
    useRepeatStatus,
    useSetCurrentTime,
    useShuffleStatus,
} from '/@/renderer/store';
import {
    useHotkeySettings,
    usePlaybackType,
    useSettingsStore,
} from '/@/renderer/store/settings.store';
import { PlaybackType, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

interface CenterControlsProps {
    playersRef: any;
}

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    align-items: center;
`;

const SliderContainer = styled.div`
    display: flex;
    width: 95%;
    height: 20px;
`;

const SliderValueWrapper = styled.div<{ $position: 'left' | 'right' }>`
    display: flex;
    flex: 1;
    align-self: center;
    justify-content: center;
    max-width: 50px;

    @media (width <= 768px) {
        display: none;
    }
`;

const SliderWrapper = styled.div`
    display: flex;
    flex: 6;
    align-items: center;
    height: 100%;
`;

const ControlsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35px;

    @media (width <= 768px) {
        ${ButtonsContainer} {
            gap: 0;
        }

        ${SliderValueWrapper} {
            display: none;
        }
    }
`;

export const CenterControls = ({ playersRef }: CenterControlsProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isSeeking, setIsSeeking] = useState(false);
    const currentSong = useCurrentSong();
    const skip = useSettingsStore((state) => state.general.skipButtons);
    const buttonSize = useSettingsStore((state) => state.general.buttonSize);
    const playbackType = usePlaybackType();
    const player1 = playersRef?.current?.player1;
    const player2 = playersRef?.current?.player2;
    const status = useCurrentStatus();
    const player = useCurrentPlayer();
    const setCurrentTime = useSetCurrentTime();
    const repeat = useRepeatStatus();
    const shuffle = useShuffleStatus();
    const { bindings } = useHotkeySettings();

    const {
        handleNextTrack,
        handlePause,
        handlePlay,
        handlePlayPause,
        handlePrevTrack,
        handleSeekSlider,
        handleSkipBackward,
        handleSkipForward,
        handleStop,
        handleToggleRepeat,
        handleToggleShuffle,
    } = useCenterControls({ playersRef });
    const handlePlayQueueAdd = usePlayQueueAdd();

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const currentTime = useCurrentTime();
    const currentPlayerRef = player === 1 ? player1 : player2;
    const duration = formatDuration(songDuration * 1000 || 0);
    const formattedTime = formatDuration(currentTime * 1000 || 0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (status === PlayerStatus.PLAYING && !isSeeking) {
            if (!isElectron() || playbackType === PlaybackType.WEB) {
                // Update twice a second for slightly better performance
                interval = setInterval(() => {
                    if (currentPlayerRef) {
                        setCurrentTime(currentPlayerRef.getCurrentTime());
                    }
                }, 500);
            }
        }

        return () => clearInterval(interval);
    }, [currentPlayerRef, isSeeking, setCurrentTime, playbackType, status]);

    const [seekValue, setSeekValue] = useState(0);

    useHotkeys([
        [bindings.playPause.isGlobal ? '' : bindings.playPause.hotkey, handlePlayPause],
        [bindings.play.isGlobal ? '' : bindings.play.hotkey, handlePlay],
        [bindings.pause.isGlobal ? '' : bindings.pause.hotkey, handlePause],
        [bindings.stop.isGlobal ? '' : bindings.stop.hotkey, handleStop],
        [bindings.next.isGlobal ? '' : bindings.next.hotkey, handleNextTrack],
        [bindings.previous.isGlobal ? '' : bindings.previous.hotkey, handlePrevTrack],
        [bindings.toggleRepeat.isGlobal ? '' : bindings.toggleRepeat.hotkey, handleToggleRepeat],
        [bindings.toggleShuffle.isGlobal ? '' : bindings.toggleShuffle.hotkey, handleToggleShuffle],
        [
            bindings.skipBackward.isGlobal ? '' : bindings.skipBackward.hotkey,
            () => handleSkipBackward(skip?.skipBackwardSeconds || 5),
        ],
        [
            bindings.skipForward.isGlobal ? '' : bindings.skipForward.hotkey,
            () => handleSkipForward(skip?.skipForwardSeconds || 5),
        ],
    ]);

    return (
        <>
            <ControlsContainer>
                <ButtonsContainer>
                    <PlayerButton
                        icon={<RiStopFill size={buttonSize} />}
                        onClick={handleStop}
                        tooltip={{
                            label: t('player.stop', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        $isActive={shuffle !== PlayerShuffle.NONE}
                        icon={<RiShuffleFill size={buttonSize} />}
                        onClick={handleToggleShuffle}
                        tooltip={{
                            label:
                                shuffle === PlayerShuffle.NONE
                                    ? t('player.shuffle', {
                                          context: 'off',
                                          postProcess: 'sentenceCase',
                                      })
                                    : t('player.shuffle', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                    <PlayerButton
                        icon={<RiSkipBackFill size={buttonSize} />}
                        onClick={handlePrevTrack}
                        tooltip={{
                            label: t('player.previous', { postProcess: 'sentenceCase' }),
                        }}
                        variant="secondary"
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={<RiRewindFill size={buttonSize} />}
                            onClick={() => handleSkipBackward(skip?.skipBackwardSeconds)}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'back',
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayerButton
                        disabled={currentSong?.id === undefined}
                        icon={
                            status === PlayerStatus.PAUSED ? (
                                <RiPlayFill size={buttonSize} />
                            ) : (
                                <IoIosPause size={buttonSize} />
                            )
                        }
                        onClick={handlePlayPause}
                        tooltip={{
                            label:
                                status === PlayerStatus.PAUSED
                                    ? t('player.play', { postProcess: 'sentenceCase' })
                                    : t('player.pause', { postProcess: 'sentenceCase' }),
                        }}
                        variant="main"
                    />
                    {skip?.enabled && (
                        <PlayerButton
                            icon={<RiSpeedFill size={buttonSize} />}
                            onClick={() => handleSkipForward(skip?.skipForwardSeconds)}
                            tooltip={{
                                label: t('player.skip', {
                                    context: 'forward',
                                    postProcess: 'sentenceCase',
                                }),
                            }}
                            variant="secondary"
                        />
                    )}
                    <PlayerButton
                        icon={<RiSkipForwardFill size={buttonSize} />}
                        onClick={handleNextTrack}
                        tooltip={{
                            label: t('player.next', { postProcess: 'sentenceCase' }),
                        }}
                        variant="secondary"
                    />
                    <PlayerButton
                        $isActive={repeat !== PlayerRepeat.NONE}
                        icon={
                            repeat === PlayerRepeat.ONE ? (
                                <RiRepeatOneLine size={buttonSize} />
                            ) : (
                                <RiRepeat2Line size={buttonSize} />
                            )
                        }
                        onClick={handleToggleRepeat}
                        tooltip={{
                            label: `${
                                repeat === PlayerRepeat.NONE
                                    ? t('player.repeat', {
                                          context: 'off',
                                          postProcess: 'sentenceCase',
                                      })
                                    : repeat === PlayerRepeat.ALL
                                      ? t('player.repeat', {
                                            context: 'all',
                                            postProcess: 'sentenceCase',
                                        })
                                      : t('player.repeat', {
                                            context: 'one',
                                            postProcess: 'sentenceCase',
                                        })
                            }`,
                        }}
                        variant="tertiary"
                    />

                    <PlayerButton
                        icon={<BsDice3 size={buttonSize} />}
                        onClick={() =>
                            openShuffleAllModal({
                                handlePlayQueueAdd,
                                queryClient,
                            })
                        }
                        tooltip={{
                            label: t('player.playRandom', { postProcess: 'sentenceCase' }),
                        }}
                        variant="tertiary"
                    />
                </ButtonsContainer>
            </ControlsContainer>
            <SliderContainer>
                <SliderValueWrapper $position="left">
                    <Text
                        $noSelect
                        $secondary
                        size="xs"
                        weight={600}
                    >
                        {formattedTime}
                    </Text>
                </SliderValueWrapper>
                <SliderWrapper>
                    <PlayerbarSlider
                        label={(value) => formatDuration(value * 1000)}
                        max={songDuration}
                        min={0}
                        onChange={(e) => {
                            setIsSeeking(true);
                            setSeekValue(e);
                        }}
                        onChangeEnd={(e) => {
                            // There is a timing bug in Mantine in which the onChangeEnd
                            // event fires before onChange. Add a small delay to force
                            // onChangeEnd to happen after onCHange
                            setTimeout(() => {
                                handleSeekSlider(e);
                                setIsSeeking(false);
                            }, 50);
                        }}
                        size={6}
                        value={!isSeeking ? currentTime : seekValue}
                        w="100%"
                    />
                </SliderWrapper>
                <SliderValueWrapper $position="right">
                    <Text
                        $noSelect
                        $secondary
                        size="xs"
                        weight={600}
                    >
                        {duration}
                    </Text>
                </SliderValueWrapper>
            </SliderContainer>
        </>
    );
};

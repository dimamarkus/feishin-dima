import { useEffect } from 'react';

import { useCurrentStatus, useQueueStatus } from '/@/renderer/store';
import { APP_NAME } from '/@/shared/constants';
import { PlayerStatus } from '/@/shared/types/types';

/**
 * Component responsible for managing the document title across all platforms
 * Shows app name with track info when playing music
 */
export const TitleManager = () => {
    const playerStatus = useCurrentStatus();
    const { currentSong, index, length } = useQueueStatus();

    useEffect(() => {
        let title = APP_NAME;

        // Add track info when music is playing
        if (length && currentSong) {
            const statusString = playerStatus === PlayerStatus.PAUSED ? '(Paused) ' : '';
            const queueString = length ? `(${index + 1} / ${length}) ` : '';
            const trackInfo = currentSong?.artistName
                ? `${statusString}${queueString}${currentSong?.name} — ${currentSong?.artistName}`
                : `${statusString}${queueString}${currentSong?.name}`;

            title = `${trackInfo} | ${APP_NAME}`;
        }

        document.title = title;
    }, [playerStatus, currentSong, index, length]);

    // This component doesn't render anything, it just manages the title
    return null;
};

import { useMemo } from 'react';
import styled from 'styled-components';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useLyricsSettings } from '/@/renderer/store';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    translatedLyrics?: null | string;
}

const UnsynchronizedLyricsContainer = styled.div<{ $gap: number }>`
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.$gap || 5}px;
    width: 100%;
    height: 100%;
    padding: 10vh 0 6vh;
    overflow: scroll;

    -webkit-mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );

    mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );
    transform: translateY(-2rem);

    @media screen and (orientation: portrait) {
        padding: 5vh 0;
    }
`;

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    source,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const settings = useLyricsSettings();
    const lines = useMemo(() => {
        return lyrics.split('\n');
    }, [lyrics]);

    const translatedLines = useMemo(() => {
        return translatedLyrics ? translatedLyrics.split('\n') : [];
    }, [translatedLyrics]);

    return (
        <UnsynchronizedLyricsContainer
            $gap={settings.gapUnsync}
            className="unsynchronized-lyrics"
        >
            {settings.showProvider && source && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSizeUnsync}
                    text={`Provided by ${source}`}
                />
            )}
            {settings.showMatch && remote && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSizeUnsync}
                    text={`"${name} by ${artist}"`}
                />
            )}
            {lines.map((text, idx) => (
                <div key={idx}>
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-line unsynchronized"
                        fontSize={settings.fontSizeUnsync}
                        id={`lyric-${idx}`}
                        text={text}
                    />
                    {translatedLines[idx] && (
                        <LyricLine
                            alignment={settings.alignment}
                            className="lyric-line unsynchronized translation"
                            fontSize={settings.fontSizeUnsync * 0.8}
                            text={translatedLines[idx]}
                        />
                    )}
                </div>
            ))}
        </UnsynchronizedLyricsContainer>
    );
};

import { Box, Center, Group, Select, SelectItem } from '@mantine/core';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiAddFill, RiSubtractFill } from 'react-icons/ri';

import { Button, NumberInput, Tooltip } from '/@/renderer/components';
import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import {
    useCurrentSong,
    useLyricsSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { LyricsOverride } from '/@/shared/types/domain-types';

interface LyricsActionsProps {
    index: number;
    languages: SelectItem[];

    onRemoveLyric: () => void;
    onResetLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
    onTranslateLyric: () => void;
    setIndex: (idx: number) => void;
}

export const LyricsActions = ({
    index,
    languages,
    onRemoveLyric,
    onResetLyric,
    onSearchOverride,
    onTranslateLyric,
    setIndex,
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = useCurrentSong();
    const { setSettings } = useSettingsStoreActions();
    const { delayMs, sources } = useLyricsSettings();

    const handleLyricOffset = (e: number) => {
        setSettings({
            lyrics: {
                ...useSettingsStore.getState().lyrics,
                delayMs: e,
            },
        });
    };

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();

    return (
        <Box style={{ position: 'relative', width: '100%' }}>
            {languages.length > 1 && (
                <Center>
                    <Select
                        clearable={false}
                        data={languages}
                        onChange={(value) => setIndex(parseInt(value!, 10))}
                        style={{ bottom: 30, position: 'absolute' }}
                        value={index.toString()}
                    />
                </Center>
            )}

            <Group position="center">
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={() =>
                            openLyricSearchModal({
                                artist: currentSong?.artistName,
                                name: currentSong?.name,
                                onSearchOverride,
                            })
                        }
                        uppercase
                        variant="subtle"
                    >
                        {t('common.search', { postProcess: 'titleCase' })}
                    </Button>
                ) : null}
                <Button
                    aria-label="Decrease lyric offset"
                    onClick={() => handleLyricOffset(delayMs - 50)}
                    variant="subtle"
                >
                    <RiSubtractFill />
                </Button>
                <Tooltip
                    label={t('setting.lyricOffset', { postProcess: 'sentenceCase' })}
                    openDelay={500}
                >
                    <NumberInput
                        aria-label="Lyric offset"
                        onChange={handleLyricOffset}
                        styles={{ input: { textAlign: 'center' } }}
                        value={delayMs || 0}
                        width={55}
                    />
                </Tooltip>
                <Button
                    aria-label="Increase lyric offset"
                    onClick={() => handleLyricOffset(delayMs + 50)}
                    variant="subtle"
                >
                    <RiAddFill />
                </Button>
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onResetLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.reset', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Group>

            <Box style={{ position: 'absolute', right: 0, top: 0 }}>
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onRemoveLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.clear', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Box>

            <Box style={{ position: 'absolute', right: 0, top: -50 }}>
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onTranslateLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.translation', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Box>
        </Box>
    );
};

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, DropdownMenu } from '/@/renderer/components';

const DISCOGS_GENRES = [
    'Blues',
    'Brass & Military',
    "Children's",
    'Classical',
    'Electronic',
    'Folk, World, & Country',
    'Funk / Soul',
    'Hip Hop',
    'Jazz',
    'Latin',
    'Non-Music',
    'Pop',
    'Reggae',
    'Rock',
    'Stage & Screen',
];

interface GenreDropdownProps {
    availableGenres?: Set<string>;
    onChange: (genre: string | undefined) => void;
    placeholder?: string;
    value?: string;
}

export const GenreDropdown = ({
    availableGenres,
    onChange,
    placeholder = 'Any genre',
    value,
}: GenreDropdownProps) => {
    const { t } = useTranslation();

    const handleGenreSelect = useCallback(
        (selectedGenre: string) => {
            if (selectedGenre === 'any') {
                onChange(undefined);
            } else {
                onChange(selectedGenre);
            }
        },
        [onChange],
    );

    // Filter genres to only show those available in the current view
    const filteredGenres = availableGenres
        ? DISCOGS_GENRES.filter((genre) => availableGenres.has(genre))
        : DISCOGS_GENRES;

    // Don't show the dropdown if no genres are available
    if (filteredGenres.length === 0) {
        return null;
    }

    const displayValue = value || placeholder;

    return (
        <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
                <Button
                    compact
                    fw={600}
                    size="md"
                    variant="subtle"
                >
                    {displayValue}
                </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <DropdownMenu.Item
                    $isActive={!value}
                    onClick={() => handleGenreSelect('any')}
                    value="any"
                >
                    {placeholder}
                </DropdownMenu.Item>
                {filteredGenres.map((genre) => (
                    <DropdownMenu.Item
                        $isActive={value === genre}
                        key={`genre-${genre}`}
                        onClick={() => handleGenreSelect(genre)}
                        value={genre}
                    >
                        {genre}
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};

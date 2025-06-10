import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelect } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres/queries/genre-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { Album, Genre, Song } from '/@/shared/types/domain-types';

const DISCOGS_MAIN_GENRES = new Set([
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
]);

interface StylesFilterDropdownProps {
    albums?: Album[];
    onChange: (styles: string[]) => void;
    placeholder?: string;
    selectedGenre?: string; // To filter styles based on selected genre
    songs?: Song[];
    value?: string[];
}

export const StylesFilterDropdown = ({
    albums = [],
    onChange,
    placeholder,
    selectedGenre,
    songs = [],
    value = [],
}: StylesFilterDropdownProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    // Get all available genres from the server
    const genresQuery = useGenreList({
        query: {
            limit: 1000,
            sortBy: 'name' as any,
            sortOrder: 'ASC' as any,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    // Extract styles present in current view (albums or songs), excluding main genres
    const availableStyles = useMemo(() => {
        const styleSet = new Set<string>();

        // Extract from albums
        albums.forEach((album) => {
            album.genres?.forEach((genre) => {
                if (!DISCOGS_MAIN_GENRES.has(genre.name)) {
                    styleSet.add(genre.name);
                }
            });
        });

        // Extract from songs
        songs.forEach((song) => {
            song.genres?.forEach((genre) => {
                if (!DISCOGS_MAIN_GENRES.has(genre.name)) {
                    styleSet.add(genre.name);
                }
            });
        });

        // Convert to sorted array
        let styles = Array.from(styleSet).sort();

        // If a genre is selected, further filter styles based on what appears with that genre
        if (selectedGenre) {
            const filteredStyles = new Set<string>();

            // Check albums for styles that appear with the selected genre
            albums.forEach((album) => {
                const hasSelectedGenre = album.genres?.some((g) => g.name === selectedGenre);
                if (hasSelectedGenre) {
                    album.genres?.forEach((genre) => {
                        if (!DISCOGS_MAIN_GENRES.has(genre.name)) {
                            filteredStyles.add(genre.name);
                        }
                    });
                }
            });

            // Check songs for styles that appear with the selected genre
            songs.forEach((song) => {
                const hasSelectedGenre = song.genres?.some((g) => g.name === selectedGenre);
                if (hasSelectedGenre) {
                    song.genres?.forEach((genre) => {
                        if (!DISCOGS_MAIN_GENRES.has(genre.name)) {
                            filteredStyles.add(genre.name);
                        }
                    });
                }
            });

            styles = Array.from(filteredStyles).sort();
        }

        return styles;
    }, [albums, songs, selectedGenre]);

    // Create options for the dropdown
    const styleOptions = useMemo(() => {
        // If we have data from the current view, use only those styles
        if (availableStyles.length > 0) {
            return availableStyles.map((styleName) => ({
                label: styleName,
                value: styleName,
            }));
        }

        // Fallback to all server genres excluding main genres if no local data
        return (genresQuery.data?.items || [])
            .filter((genre: Genre) => !DISCOGS_MAIN_GENRES.has(genre.name))
            .map((genre: Genre) => ({
                label: genre.name,
                value: genre.name,
            }));
    }, [availableStyles, genresQuery.data?.items]);

    const handleChange = useCallback(
        (selectedStyles: string[]) => {
            onChange(selectedStyles);
        },
        [onChange],
    );

    // Don't show the dropdown if there are no styles available
    if (styleOptions.length === 0) {
        return null;
    }

    return (
        <MultiSelect
            clearable
            data={styleOptions}
            maxSelectedValues={5}
            onChange={handleChange}
            placeholder={placeholder || t('filter.style', { postProcess: 'titleCase' }) || 'Styles'}
            searchable
            size="xs"
            value={value}
            width={200}
        />
    );
};

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelect } from '/@/renderer/components';
import { useGenreList } from '/@/renderer/features/genres/queries/genre-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { Album, Genre, Song } from '/@/shared/types/domain-types';

interface GenreFilterDropdownProps {
    albums?: Album[];
    onChange: (genres: string[]) => void;
    placeholder?: string;
    songs?: Song[];
    value?: string[];
}

export const GenreFilterDropdown = ({
    albums = [],
    onChange,
    placeholder,
    songs = [],
    value = [],
}: GenreFilterDropdownProps) => {
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

    // Extract genres present in current view (albums or songs)
    const availableGenres = useMemo(() => {
        const genreSet = new Set<string>();

        // Extract from albums
        albums.forEach((album) => {
            album.genres?.forEach((genre) => {
                genreSet.add(genre.name);
            });
        });

        // Extract from songs
        songs.forEach((song) => {
            song.genres?.forEach((genre) => {
                genreSet.add(genre.name);
            });
        });

        // Convert to sorted array
        return Array.from(genreSet).sort();
    }, [albums, songs]);

    // Create options for the dropdown
    const genreOptions = useMemo(() => {
        // If we have data from the current view, use only those genres
        if (availableGenres.length > 0) {
            return availableGenres.map((genreName) => ({
                label: genreName,
                value: genreName,
            }));
        }

        // Fallback to all server genres if no local data
        return (genresQuery.data?.items || []).map((genre: Genre) => ({
            label: genre.name,
            value: genre.name,
        }));
    }, [availableGenres, genresQuery.data?.items]);

    const handleChange = useCallback(
        (selectedGenres: string[]) => {
            onChange(selectedGenres);
        },
        [onChange],
    );

    // Don't show the dropdown if there are no genres available
    if (genreOptions.length === 0) {
        return null;
    }

    return (
        <MultiSelect
            clearable
            data={genreOptions}
            maxSelectedValues={5}
            onChange={handleChange}
            placeholder={placeholder || t('filter.genre', { postProcess: 'titleCase' })}
            searchable
            size="xs"
            value={value}
            width={200}
        />
    );
};

import { Center } from '@mantine/core';
import { RiCalendarEventFill } from 'react-icons/ri';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';

import { YearPlaylist } from '../years-playlists';

import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useCurrentServer } from '/@/renderer/store';
import { Album, AlbumListSort, SortOrder } from '/@/shared/types/domain-types';

interface YearAlbumMosaicProps {
    size?: number;
    yearPlaylist: YearPlaylist;
}

const MosaicContainer = styled.div<{ size: number }>`
    width: ${(props) => props.size}px;
    height: ${(props) => props.size}px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 2px;
    border-radius: var(--card-default-radius);
    overflow: hidden;
    background: var(--main-bg);
    flex-shrink: 0;
`;

const MosaicItem = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 2px;
`;

const Image = styled(SimpleImg)`
    width: 100%;
    height: 100%;
    object-fit: var(--image-fit, cover);
    display: block;

    img {
        width: 100%;
        height: 100%;
        object-fit: var(--image-fit, cover);
        display: block;
    }
`;

const PlaceholderContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--main-bg-secondary);
    border-radius: 2px;
`;

export const YearAlbumMosaic = ({ size = 200, yearPlaylist }: YearAlbumMosaicProps) => {
    const server = useCurrentServer();

    // Create album query filters based on year/decade
    const albumQuery = useAlbumList({
        options: {
            cacheTime: 1000 * 60 * 60, // 1 hour cache
            enabled: Boolean(server),
            refetchOnWindowFocus: false, // Don't refetch on focus
            staleTime: 1000 * 60 * 30, // 30 minutes - longer for cover art data
        },
        query: {
            limit: 20, // Get more albums to have a better selection of covers
            maxYear: Array.isArray(yearPlaylist.releaseYearValue)
                ? Math.max(...yearPlaylist.releaseYearValue)
                : yearPlaylist.releaseYearValue,
            minYear: Array.isArray(yearPlaylist.releaseYearValue)
                ? Math.min(...yearPlaylist.releaseYearValue)
                : yearPlaylist.releaseYearValue,
            sortBy: AlbumListSort.RANDOM,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    // Filter albums that have images and limit to 4
    const albumsWithImages = (albumQuery.data?.items || [])
        .filter((album): album is Album & { imageUrl: string } => !!album.imageUrl)
        .slice(0, 4);

    // If no albums have images, show placeholder
    if (albumsWithImages.length === 0) {
        return (
            <Center
                style={{
                    background: 'var(--placeholder-bg)',
                    borderRadius: 'var(--card-default-radius)',
                    height: size,
                    width: size,
                }}
            >
                <RiCalendarEventFill
                    color="var(--placeholder-fg)"
                    size={35}
                />
            </Center>
        );
    }

    const getGridStyle = (count: number) => {
        switch (count) {
            case 1:
                return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
            case 2:
                return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
            case 3:
                return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
            case 4:
            default:
                return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
        }
    };

    const getItemStyle = (index: number, count: number) => {
        if (count === 3) {
            if (index === 0) {
                return { gridColumn: '1 / -1', gridRow: '1' };
            } else if (index === 1) {
                return { gridColumn: '1', gridRow: '2' };
            } else {
                return { gridColumn: '2', gridRow: '2' };
            }
        }
        return {};
    };

    return (
        <MosaicContainer
            size={size}
            style={getGridStyle(albumsWithImages.length)}
        >
            {albumsWithImages.map((album, index) => (
                <MosaicItem
                    key={album.id}
                    style={getItemStyle(index, albumsWithImages.length)}
                >
                    <Image
                        importance="auto"
                        placeholder="var(--placeholder-bg)"
                        src={album.imageUrl}
                    />
                </MosaicItem>
            ))}
        </MosaicContainer>
    );
};

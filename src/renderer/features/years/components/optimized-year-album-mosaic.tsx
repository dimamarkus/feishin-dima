import { Center } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { RiCalendarEventFill } from 'react-icons/ri';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';

import { YearPlaylist } from '../years-playlists';

import { Album } from '/@/shared/types/domain-types';

interface OptimizedYearAlbumMosaicProps {
    albums?: Album[]; // Pre-fetched albums from optimized hook
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

const LoadingPlaceholder = styled.div<{ size: number }>`
    width: ${(props) => props.size}px;
    height: ${(props) => props.size}px;
    background: var(--placeholder-bg);
    border-radius: var(--card-default-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 1.5s ease-in-out infinite alternate;

    @keyframes pulse {
        0% {
            opacity: 0.6;
        }
        100% {
            opacity: 1;
        }
    }
`;

export const OptimizedYearAlbumMosaic = ({
    albums = [],
    size = 200,
    yearPlaylist,
}: OptimizedYearAlbumMosaicProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const currentRef = ref.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded) {
                        setIsVisible(true);
                        setHasLoaded(true);
                    }
                });
            },
            {
                root: null,
                rootMargin: '50px', // Start loading 50px before coming into view
                threshold: 0.1,
            },
        );

        observer.observe(currentRef);

        return () => {
            observer.disconnect();
        };
    }, [hasLoaded]);

    // If not visible yet, show loading placeholder
    if (!isVisible) {
        return (
            <LoadingPlaceholder
                ref={ref}
                size={size}
            >
                <RiCalendarEventFill
                    color="var(--placeholder-fg)"
                    size={20}
                />
            </LoadingPlaceholder>
        );
    }

    // Filter albums that have images and limit to 4
    const albumsWithImages = albums
        .filter((album): album is Album & { imageUrl: string } => !!album.imageUrl)
        .slice(0, 4);

    // If no albums have images, show placeholder
    if (albumsWithImages.length === 0) {
        return (
            <Center
                ref={ref}
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
            ref={ref}
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

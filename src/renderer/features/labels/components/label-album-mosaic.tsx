import { Center } from '@mantine/core';
import { RiPriceTag3Fill } from 'react-icons/ri';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';

import { Album } from '/@/shared/types/domain-types';

interface LabelAlbumMosaicProps {
    albums: Album[];
    size?: number;
}

const MosaicContainer = styled.div<{ $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    display: grid;
    gap: 2px;
    border-radius: var(--card-default-radius);
    overflow: hidden;
    background: var(--placeholder-bg);
`;

const AlbumCover = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--placeholder-bg);
`;

const Image = styled(SimpleImg)`
    width: 100%;
    height: 100%;
    object-fit: var(--image-fit);

    img {
        width: 100%;
        height: 100%;
        object-fit: var(--image-fit);
    }
`;

export const LabelAlbumMosaic = ({ albums, size = 200 }: LabelAlbumMosaicProps) => {
    // Filter albums that have images and limit to 4
    const albumsWithImages = albums
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
                <RiPriceTag3Fill
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
            $size={size}
            style={getGridStyle(albumsWithImages.length)}
        >
            {albumsWithImages.map((album, index) => (
                <AlbumCover
                    key={album.id}
                    style={getItemStyle(index, albumsWithImages.length)}
                >
                    <Image
                        importance="auto"
                        placeholder="var(--placeholder-bg)"
                        src={album.imageUrl}
                    />
                </AlbumCover>
            ))}
        </MosaicContainer>
    );
};
